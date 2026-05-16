import { Ingestor, type RawBatch } from "../ingestor";

// Mock stand-in for a real X v2 ingestor. Emits items in a parsed `XPost`
// shape that mirrors the live X v2 API response (numeric Snowflake-style
// tweet ids, numeric user ids, second-precision ISO timestamps), so the
// LLM stage and downstream consumers can be exercised end-to-end without
// an X API key. A future real X ingestor should produce the same `XPost`
// shape so swapping it in is a no-op for everything downstream.

// The shape staged into `data/raw/x/...` for each post. Kept here because
// `MockXIngestor` is the only producer today; move to a shared file once
// a second producer appears.
export interface XPost {
  id: string;
  text: string;
  authorId: string;
  authorUsername?: string;
  authorName?: string;
  createdAt: string;
  lang?: string;
  metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
  };
  hashtags: string[];
  mentions: string[];
  urls: string[];
}
//
// Two flavours of post are mixed in:
//   - RELEVANT_POSTS_BY_TAG — civic issues (lighting, manholes, parking,
//                              illegal parking) the app is meant to triage.
//   - NOISE_POSTS_BY_TAG    — off-topic posts that happen to match the tag
//                              (tourism, Hajduk, food, puns). These exist
//                              so the LLM filtering stage has actual junk
//                              to reject.

const DEFAULT_MOCK_TAGS = ["#split", "@split"] as const;

// Snowflake-ish base for generated tweet ids. Real X tweet ids in 2026 are
// 19-digit numeric strings near 1.9e18; we don't care about exact epoch
// math, just that the strings look plausible to a human reading the JSON.
const TWEET_ID_BASE = BigInt("1900000000000000000");

export interface MockXIngestorOptions {
  tags?: readonly string[];
  rawDir?: string;
  // Override the default scheduling cadence. Useful for tests.
  intervalMs?: number;
  // Injectable clock for deterministic tests. Defaults to wall time.
  now?: () => Date;
}

const DEFAULT_MOCK_INTERVAL_MS = 10 * 60 * 1000;

const X_LLM_INSTRUCTIONS = `# X (Twitter) ingestion — LLM stage instructions

You are processing raw files staged by the X ingestor. Each file in this
folder is a JSON document with the shape:

\`\`\`json
{
  "dataSource": "x",
  "fetchedAt": "<ISO timestamp>",
  "source": "<tag, e.g. #split or @split>",
  "items": [ <XPost>, ... ]
}
\`\`\`

Each \`XPost\` has at least: \`id\`, \`text\`, \`authorId\`, \`authorUsername\`,
\`authorName\`, \`createdAt\` (ISO 8601 with offset), \`lang\`, \`metrics\`,
\`hashtags\`, \`mentions\`, \`urls\`.

## What to keep

Only civic-issue posts from residents/visitors of Split that fall into one
of: broken or missing street lighting, damaged or missing manhole covers,
damaged road surfaces, parking shortages, illegal parking. A post must
describe an actual real-world problem at a real location — not a joke,
opinion, ad, news headline, tourism tip, sports comment, or generic
complaint without a locatable issue.

## What to drop

Everything else: tourism, food, Hajduk/sports, puns, retweets without new
information, promotional content, posts in languages other than Croatian
or English unless the issue is clearly described.

## Output shape

For each kept post, emit one record matching:

\`\`\`json
{
  "dataSource": "x",
  "summary": "<one-sentence description of the issue in English>",
  "timestamp": "<the post's createdAt, ISO 8601 with offset>",
  "metadata": {
    "postId": "<XPost.id>",
    "authorUsername": "<XPost.authorUsername>",
    "sourceTag": "<the 'source' field from the input envelope>",
    "originalText": "<XPost.text, verbatim>",
    "lang": "<XPost.lang>",
    "urls": [ ... ]
  }
}
\`\`\`

## Where to write

Write the output JSON array to \`data/llm-out/x/<original-filename>.json\`,
mirroring the input filename. One input file → one output file. Do not
overwrite files that already exist there; if a collision happens, append
a numeric suffix.
`;

export class MockXIngestor extends Ingestor<XPost> {
  readonly dataSource = "x";
  readonly intervalMs: number;
  readonly llmInstructions = X_LLM_INSTRUCTIONS;
  private readonly tags: readonly string[];
  private readonly now: () => Date;

  constructor(options: MockXIngestorOptions = {}) {
    super(options.rawDir);
    this.tags = options.tags?.length ? options.tags : DEFAULT_MOCK_TAGS;
    this.intervalMs = options.intervalMs ?? DEFAULT_MOCK_INTERVAL_MS;
    this.now = options.now ?? (() => new Date());
  }

  protected async fetchRaw(): Promise<RawBatch<XPost>[]> {
    const now = this.now();
    return this.tags.map((tag) => ({
      source: tag,
      items: buildMockPosts(tag, now),
    }));
  }

  protected getDedupeId(item: XPost): string {
    return item.id;
  }

  // Stub returns nothing so every item is treated as new; a real
  // implementation will read from whatever persistence backs this
  // ingestor's dedup memory (state file, DB, scan of raw folder...).
  protected async getItemsByDedupeIdList(_ids: string[]): Promise<string[]> {
    return [];
  }
}

interface PostTemplate {
  text: string;
  authorUsername: string;
  authorName: string;
  authorId: string; // numeric string, like real X user ids
  ageMinutes: number;
  lang: "hr" | "en";
  extraHashtags?: string[];
  extraMentions?: string[];
  // Use the {tweetId} placeholder to embed the generated tweet id; it's
  // substituted at materialization time so photo URLs stay consistent
  // with their parent tweet's id (matching how X expanded_urls work).
  urls?: string[];
  metrics?: XPost["metrics"];
}

// --- Relevant: civic issues the app is meant to triage --------------------

const RELEVANT_POSTS_BY_TAG: Record<string, PostTemplate[]> = {
  "#split": [
    {
      text: "Lampa kod ulaza u park Šuma Marjan ne radi već tjedan dana. Navečer je opasno trčati, ništa se ne vidi. #split",
      authorUsername: "ana_marjan",
      authorName: "Ana K.",
      authorId: "824517392",
      ageMinutes: 42,
      lang: "hr",
      extraHashtags: ["rasvjeta"],
      metrics: {
        retweet_count: 2,
        reply_count: 4,
        like_count: 18,
        quote_count: 0,
      },
    },
    {
      text: "Šaht na križanju Domovinskog rata i Poljičke propao je, auto mi je skoro upao u rupu. Hitno popraviti prije nego se netko ozlijedi! #split",
      authorUsername: "tomislav_s",
      authorName: "Tomislav P.",
      authorId: "1247853904",
      ageMinutes: 95,
      lang: "hr",
      extraHashtags: ["sahtovi", "ceste"],
      urls: ["https://twitter.com/tomislav_s/status/{tweetId}/photo/1"],
      metrics: {
        retweet_count: 11,
        reply_count: 7,
        like_count: 34,
        quote_count: 1,
      },
    },
    {
      text: "Opet auto parkiran na pješačkom prijelazu kod Pazara. Kolica s djetetom moram gurat na cestu. Komunalci gdje ste? #split",
      authorUsername: "marija_pazar",
      authorName: "Marija B.",
      authorId: "982347156",
      ageMinutes: 18,
      lang: "hr",
      extraHashtags: ["nepropisno_parkiranje"],
      metrics: {
        retweet_count: 5,
        reply_count: 12,
        like_count: 47,
        quote_count: 2,
      },
    },
    {
      text: "Na Žnjanu navečer pola ulične rasvjete ne radi, šetnja je postala doslovno avantura. Treba li čekat ljeto pa da neko reagira? #split",
      authorUsername: "ivan_znjan",
      authorName: "Ivan M.",
      authorId: "1845792003",
      ageMinutes: 220,
      lang: "hr",
      extraHashtags: ["rasvjeta", "znjan"],
      metrics: {
        retweet_count: 3,
        reply_count: 2,
        like_count: 21,
        quote_count: 0,
      },
    },
    {
      text: "Stanari Spinuta već treći tjedan ne mogu naći parking jer su parkirališta zatvorena bez ikakve obavijesti. Što se događa? #split",
      authorUsername: "spinut_dom",
      authorName: "Petra L.",
      authorId: "2104958327",
      ageMinutes: 360,
      lang: "hr",
      extraHashtags: ["parking", "spinut"],
      metrics: {
        retweet_count: 8,
        reply_count: 9,
        like_count: 29,
        quote_count: 1,
      },
    },
    {
      text: "Manhole cover missing on Ulica kralja Tomislava right by the bus stop. Tourist almost stepped into it last night. Please fix asap. #split",
      authorUsername: "split_visitor",
      authorName: "Daniel R.",
      authorId: "1582934721",
      ageMinutes: 75,
      lang: "en",
      extraHashtags: ["safety"],
      urls: ["https://twitter.com/split_visitor/status/{tweetId}/photo/1"],
      metrics: {
        retweet_count: 4,
        reply_count: 3,
        like_count: 15,
        quote_count: 0,
      },
    },
  ],
  "@split": [
    {
      text: "@split na Bačvicama ne radi pola lampi uz šetnicu, jučer sam skoro pala preko bicikla u mraku. Molim vas riješite.",
      authorUsername: "lucija_bacvice",
      authorName: "Lucija H.",
      authorId: "938472615",
      ageMinutes: 28,
      lang: "hr",
      extraHashtags: ["rasvjeta", "bacvice"],
      metrics: {
        retweet_count: 1,
        reply_count: 5,
        like_count: 22,
        quote_count: 0,
      },
    },
    {
      text: "@split kombi već 4 dana parkiran na invalidskom mjestu ispred Joker centra. Nitko ne reagira. Tablica na slici.",
      authorUsername: "joker_susjed",
      authorName: "Goran V.",
      authorId: "1471829304",
      ageMinutes: 140,
      lang: "hr",
      extraHashtags: ["nepropisno_parkiranje", "invalidsko"],
      urls: ["https://twitter.com/joker_susjed/status/{tweetId}/photo/1"],
      metrics: {
        retweet_count: 14,
        reply_count: 11,
        like_count: 63,
        quote_count: 3,
      },
    },
    {
      text: "@split kad ćete riješit parking na Mejašima? Ljudi parkiraju po travnjacima jer doslovno nema mjesta navečer.",
      authorUsername: "mejasi_2026",
      authorName: "Nikola Ć.",
      authorId: "2841759302",
      ageMinutes: 280,
      lang: "hr",
      extraHashtags: ["parking", "mejasi"],
      metrics: {
        retweet_count: 6,
        reply_count: 8,
        like_count: 31,
        quote_count: 1,
      },
    },
    {
      text: "@split šaht u Velebitskoj propao i opet je samo stavljen kup s narandzastim čunjevima. Drugi tjedan tako. Hoće li se ikad popraviti?",
      authorUsername: "velebitska_resident",
      authorName: "Sanja K.",
      authorId: "1029384756",
      ageMinutes: 55,
      lang: "hr",
      extraHashtags: ["sahtovi"],
      metrics: {
        retweet_count: 9,
        reply_count: 6,
        like_count: 27,
        quote_count: 0,
      },
    },
    {
      text: "@split parking ispred Doma zdravlja na Visokoj je pun auta s neistaknutim oznakama, stariji ljudi ne mogu doć do ulaza.",
      authorUsername: "visoka_ulica",
      authorName: "Marin D.",
      authorId: "847362950",
      ageMinutes: 410,
      lang: "hr",
      extraHashtags: ["nepropisno_parkiranje", "parking"],
      metrics: {
        retweet_count: 7,
        reply_count: 4,
        like_count: 19,
        quote_count: 1,
      },
    },
    {
      text: "@split street light on Šperun has been flickering for three weeks. Whole alley goes dark at random. Tourists keep bumping into bins.",
      authorUsername: "old_town_split",
      authorName: "Emma S.",
      authorId: "1593847203",
      ageMinutes: 165,
      lang: "en",
      extraHashtags: ["rasvjeta", "starigrad"],
      metrics: {
        retweet_count: 2,
        reply_count: 1,
        like_count: 12,
        quote_count: 0,
      },
    },
  ],
};

// --- Noise: off-topic posts the LLM stage must filter out ----------------
// These all match the search tag but have nothing to do with civic issues.
// Mix of tourism, sports, food, puns, and unrelated questions.

const NOISE_POSTS_BY_TAG: Record<string, PostTemplate[]> = {
  "#split": [
    {
      text: "Sunset from Riva tonight was absolutely unreal 🌅 #split is magical in May",
      authorUsername: "wanderlust_eu",
      authorName: "Hannah W.",
      authorId: "612083475",
      ageMinutes: 65,
      lang: "en",
      extraHashtags: ["travel", "croatia", "sunset"],
      metrics: {
        retweet_count: 18,
        reply_count: 4,
        like_count: 142,
        quote_count: 2,
      },
    },
    {
      text: "Hajduk večeras na Poljudu, tko ide?! Karte još ima na blagajni 💙 #split #hajduk",
      authorUsername: "torcida_fan",
      authorName: "Bruno T.",
      authorId: "1736482910",
      ageMinutes: 200,
      lang: "hr",
      extraHashtags: ["hajduk", "nogomet"],
      metrics: {
        retweet_count: 24,
        reply_count: 11,
        like_count: 89,
        quote_count: 5,
      },
    },
    {
      text: "Wordle 1247 — got it in 3, today's word had me split between two guesses 🧠 #split #wordle",
      authorUsername: "puzzle_daily",
      authorName: "Sam J.",
      authorId: "428193057",
      ageMinutes: 320,
      lang: "en",
      extraHashtags: ["wordle"],
      metrics: {
        retweet_count: 0,
        reply_count: 1,
        like_count: 7,
        quote_count: 0,
      },
    },
    {
      text: "Banana split za doručak, ne kajem se 🍌🍦 ko sa mnom? #split",
      authorUsername: "slatka_kuhinja",
      authorName: "Iva G.",
      authorId: "1284756301",
      ageMinutes: 480,
      lang: "hr",
      extraHashtags: ["dessert", "food"],
      metrics: {
        retweet_count: 1,
        reply_count: 6,
        like_count: 33,
        quote_count: 0,
      },
    },
  ],
  "@split": [
    {
      text: "@split anyone know a good english-speaking dentist downtown? Friend's visiting next week 🦷",
      authorUsername: "expat_in_dalmatia",
      authorName: "Olivia P.",
      authorId: "1972648305",
      ageMinutes: 90,
      lang: "en",
      metrics: {
        retweet_count: 0,
        reply_count: 12,
        like_count: 4,
        quote_count: 0,
      },
    },
    {
      text: "@split sunset cruise yesterday with @dalmatia_sails was incredible, captain Toni je legenda ⛵️🌅",
      authorUsername: "med_traveler",
      authorName: "Lukas B.",
      authorId: "538472916",
      ageMinutes: 380,
      lang: "en",
      extraMentions: ["dalmatia_sails"],
      extraHashtags: ["travel", "sailing"],
      metrics: {
        retweet_count: 3,
        reply_count: 2,
        like_count: 41,
        quote_count: 0,
      },
    },
    {
      text: "@split koji je najbolji burek u gradu? Stigli smo jučer i moramo isprobat sve 🥟",
      authorUsername: "foodie_zg",
      authorName: "Karla M.",
      authorId: "1849275638",
      ageMinutes: 150,
      lang: "hr",
      extraHashtags: ["foodie", "burek"],
      metrics: {
        retweet_count: 2,
        reply_count: 27,
        like_count: 38,
        quote_count: 1,
      },
    },
    {
      text: "@split debugging a string.split() infinite loop at 2am, send help 😩 #devlife",
      authorUsername: "code_owl",
      authorName: "Ben H.",
      authorId: "763295810",
      ageMinutes: 12,
      lang: "en",
      extraHashtags: ["devlife", "javascript"],
      metrics: {
        retweet_count: 0,
        reply_count: 3,
        like_count: 11,
        quote_count: 0,
      },
    },
  ],
};

function buildMockPosts(tag: string, now: Date): XPost[] {
  const relevant =
    RELEVANT_POSTS_BY_TAG[tag] ?? RELEVANT_POSTS_BY_TAG["#split"];
  const noise = NOISE_POSTS_BY_TAG[tag] ?? [];
  // Interleave so the LLM filter sees a mix, not a clean front-loaded
  // section of relevant posts followed by all the noise.
  const combined = interleave(relevant, noise);
  return combined.map((tpl, i) => makePost(tag, tpl, i, now));
}

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}

function makePost(
  tag: string,
  tpl: PostTemplate,
  index: number,
  now: Date,
): XPost {
  // Real X timestamps are second-precision (e.g. "2026-05-16T10:14:23.000Z").
  // toISOString() defaults to millisecond precision, so zero the ms first.
  const created = new Date(now.getTime() - tpl.ageMinutes * 60_000);
  created.setUTCMilliseconds(0);
  const createdAt = created.toISOString();

  const tweetId = makeTweetId(tag, index);

  const hashtags = uniq([
    ...(tag.startsWith("#") ? [tag.slice(1)] : []),
    ...(tpl.extraHashtags ?? []),
  ]);
  const mentions = uniq([
    ...(tag.startsWith("@") ? [tag.slice(1)] : []),
    ...(tpl.extraMentions ?? []),
  ]);
  const urls = (tpl.urls ?? []).map((u) => u.replaceAll("{tweetId}", tweetId));

  return {
    id: tweetId,
    text: tpl.text,
    authorId: tpl.authorId,
    authorUsername: tpl.authorUsername,
    authorName: tpl.authorName,
    createdAt,
    lang: tpl.lang,
    metrics: tpl.metrics ?? {
      retweet_count: 0,
      reply_count: 0,
      like_count: 0,
      quote_count: 0,
    },
    hashtags,
    mentions,
    urls,
  };
}

// Deterministic 19-digit numeric id derived from (tag, index). Mirrors the
// look of an X Snowflake id without bothering with the real epoch math.
function makeTweetId(tag: string, index: number): string {
  const tagOffset = BigInt(djb2(tag) % 100_000) * BigInt(10_000);
  return (TWEET_ID_BASE + tagOffset + BigInt(index)).toString();
}

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff;
  }
  return h;
}

function uniq<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}
