import { Ingestor, type RawBatch } from "../ingestor";
import {
  fetchSubredditItems,
  type RedditItem,
} from "./redditScraper";

// Reddit ingestor: hits Reddit's public JSON listings for the curated set of
// subreddits, stages one raw file per subreddit so the LLM stage has clear
// per-source attribution. Mirrors `MockXIngestor`'s structure so the
// orchestrator can treat both sources identically.

const DEFAULT_SUBREDDITS = ["Split", "croatia"] as const;
// 30 min cadence is intentionally slower than the X mock (10 min) because
// the public Reddit JSON endpoints are unauthenticated and aggressive in
// rate-limiting; doubling the gap keeps a long demo session safe.
const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
// Tight per-subreddit cap because every kept post optionally fans out into
// a comments fetch, and the rate-limiter serializes everything at 2s/req.
const DEFAULT_LIMIT_PER_SUBREDDIT = 10;

const REDDIT_LLM_INSTRUCTIONS = `# Reddit ingestion — LLM stage instructions

You are processing raw files staged by the Reddit ingestor. Each file in this
folder is a JSON document with the shape:

\`\`\`json
{
  "dataSource": "reddit",
  "fetchedAt": "<ISO timestamp>",
  "source": "<subreddit, e.g. Split or croatia>",
  "items": [ <RedditItem>, ... ]
}
\`\`\`

Each \`RedditItem\` has at least: \`id\`, \`title\`, \`body\`, \`author\`,
\`subreddit\`, \`score\`, \`createdAt\` (ISO 8601 with offset), \`permalink\`
(absolute reddit.com URL), \`url\` (the post's link target), \`comments\`
(array of \`{ id, author, body, score, createdAt }\`).

## What to keep

Only civic-issue posts from residents/visitors of Split (Croatia) describing
an actual real-world problem at a locatable place — broken or missing street
lighting, damaged or missing manhole covers, damaged road surfaces, parking
shortages, illegal parking, waste/sanitation problems, water or sewage
issues, public transit complaints with a specific locatable issue. Use the
comments to disambiguate or confirm location/severity, not as standalone
signal.

## What to drop

Everything else: tourism questions, restaurant or bar recommendations, real
estate discussion, Hajduk/sports threads, politics, news links without a
locatable issue, jokes/memes, and generic complaints that don't name a place.
Drop posts in languages other than Croatian or English unless the issue is
clearly described.

## Output shape

For each kept post, emit one record matching:

\`\`\`json
{
  "dataSource": "reddit",
  "summary": "<one-sentence description of the issue in Croatian>",
  "timestamp": "<the post's createdAt, ISO 8601 with offset>",
  "metadata": {
    "postId": "<RedditItem.id>",
    "author": "<RedditItem.author>",
    "subreddit": "<RedditItem.subreddit>",
    "permalink": "<RedditItem.permalink>",
    "originalTitle": "<RedditItem.title, verbatim>",
    "originalBody": "<RedditItem.body, verbatim>",
    "score": <RedditItem.score>
  }
}
\`\`\`

## Where to write

Write the output JSON array to \`data/llm-out/reddit/<original-filename>.json\`,
mirroring the input filename. One input file → one output file. Do not
overwrite files that already exist there; if a collision happens, append a
numeric suffix.
`;

export interface RedditIngestorOptions {
  subreddits?: readonly string[];
  rawDir?: string;
  intervalMs?: number;
  limitPerSubreddit?: number;
  includeComments?: boolean;
  commentsPerPost?: number;
}

export class RedditIngestor extends Ingestor<RedditItem> {
  readonly dataSource = "reddit";
  readonly intervalMs: number;
  readonly llmInstructions = REDDIT_LLM_INSTRUCTIONS;
  private readonly subreddits: readonly string[];
  private readonly limitPerSubreddit: number;
  private readonly includeComments: boolean;
  private readonly commentsPerPost: number;

  constructor(options: RedditIngestorOptions = {}) {
    super(options.rawDir);
    this.subreddits = options.subreddits?.length
      ? options.subreddits
      : DEFAULT_SUBREDDITS;
    this.intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
    this.limitPerSubreddit =
      options.limitPerSubreddit ?? DEFAULT_LIMIT_PER_SUBREDDIT;
    this.includeComments = options.includeComments ?? false;
    this.commentsPerPost = options.commentsPerPost ?? 5;
  }

  protected async fetchRaw(): Promise<RawBatch<RedditItem>[]> {
    const batches: RawBatch<RedditItem>[] = [];
    for (const subreddit of this.subreddits) {
      try {
        const items = await fetchSubredditItems(subreddit, {
          limit: this.limitPerSubreddit,
          includeComments: this.includeComments,
          commentsPerPost: this.commentsPerPost,
        });
        if (items.length > 0) {
          batches.push({ source: subreddit, items });
        }
      } catch (err) {
        // One bad subreddit (rate limit, transient 5xx) shouldn't drop the
        // others from this tick. The orchestrator will retry on next tick.
        const error = err instanceof Error ? err : new Error(String(err));
        console.warn(
          `[ingest:reddit] r/${subreddit} fetch failed: ${error.message}`,
        );
      }
    }
    return batches;
  }

  protected getDedupeId(item: RedditItem): string {
    return item.id;
  }

  // Stub returns nothing so every item is treated as new; a real
  // implementation will read from whatever persistence backs this
  // ingestor's dedup memory (state file, DB, scan of raw folder...).
  protected async getItemsByDedupeIdList(_ids: string[]): Promise<string[]> {
    return [];
  }
}
