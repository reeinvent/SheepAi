import { Ingestor, RawBatch } from "../ingestor";
import { scrapeAllSources, ScrapedArticle } from "../../../lib/scrapers/rss";

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

export class NewsIngestor extends Ingestor<ScrapedArticle> {
  readonly dataSource = "news";

  readonly intervalMs = TWELVE_HOURS_MS;

  readonly llmInstructions = `
# News Ingestor — LLM processing instructions

## Source
Croatian local news RSS feeds filtered to Split city civic issues.
Each raw file contains a \`RawIngestionPayload<ScrapedArticle>\` envelope.

## Your task
For each article in \`items[]\`, decide if it describes a **genuine, actionable
civic issue** in the city of Split (broken roads, waste, flooding, water outage,
noise, illegal construction, sea pollution, electricity outages, etc.).

Skip:
- Political commentary with no concrete infrastructure problem
- Event announcements, cultural news, sports results
- Articles where the matched keyword is a false positive (e.g. "voda" meaning
  "lead" in a sports context rather than "water")

## Output shape
Return a JSON array of records. Each record must match:

\`\`\`json
{
  "dataSource": "<newspaper name, e.g. Dalmacija Danas>",
  "summary": "<1–3 sentence objective summary in Croatian>",
  "timestamp": "<ISO 8601 with timezone offset from the article pubDate>",
  "metadata": {
    "url": "<article url>",
    "source": "<newspaper name>",
    "title": "<original Croatian title>",
    "category": "<roads|waste|water|electricity|noise|construction|transport|green|other>",
    "severity": "<low|medium|high>",
    "matchedKeywords": ["<kw1>", "..."]
  }
}
\`\`\`

Return ONLY the JSON array. No prose, no markdown fences.
If no articles are actionable, return \`[]\`.
`.trim();

  protected async fetchRaw(): Promise<RawBatch<ScrapedArticle>[]> {
    const { articles, errors } = await scrapeAllSources();

    for (const e of errors) {
      console.warn(`[NewsIngestor] ${e.source}: ${e.error}`);
    }

    return [{ source: "news", items: articles }];
  }

  // Article URL is the stable dedup key — the same article will always have
  // the same URL across runs, so re-fetching after the cutoff window reopens
  // won't stage the same article twice.
  protected getDedupeId(item: ScrapedArticle): string {
    return item.url;
  }

  // No persistence yet — treat every item as new and rely on the date-based
  // cutoff in the scraper to avoid pulling stale archive content.
  protected async getItemsByDedupeIdList(_ids: string[]): Promise<string[]> {
    return [];
  }
}
