import Parser from "rss-parser";
import { normalizeCroatian, matchedKeywords } from "../../src/ingestion/keywords";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface ScrapedArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
  matchedKeywords: string[];
}

interface Source {
  name: string;
  feed: string;
  // true = Split tag/category feed — no need to check for "split" in text
  splitFeed: boolean;
  // How many RSS pages to fetch (?paged=N).
  maxPages: number;
}

// Only keep articles published within this many days. Since the ingestor
// runs every 12 h we only need recent content; deep archive adds cost with
// no benefit and makes each run much slower.
const MAX_AGE_DAYS = 3;

const SOURCES: Source[] = [
  {
    name: "Slobodna Dalmacija",
    feed: "https://slobodnadalmacija.hr/feed",
    splitFeed: false,
    maxPages: 10,
  },
  {
    name: "Morski.hr",
    feed: "https://www.morski.hr/rss/",
    splitFeed: false,
    maxPages: 10,
  },
  {
    name: "Dalmacija Danas",
    feed: "https://www.dalmacijadanas.hr/rubrika/dalmacija/split/feed/",
    splitFeed: true,
    maxPages: 10,
  },
  {
    name: "Dalmacija News",
    feed: "https://www.dalmacijanews.hr/kategorija/vijesti/split/feed/",
    splitFeed: true,
    maxPages: 10,
  },
  {
    name: "Index.hr",
    // National outlet — single page feed (no pagination)
    feed: "https://www.index.hr/rss",
    splitFeed: false,
    maxPages: 10,
  },
];

export async function scrapeAllSources(): Promise<{
  articles: ScrapedArticle[];
  errors: { source: string; error: string }[];
}> {
  const parser = new Parser({
    timeout: 8000,
    headers: { "User-Agent": "SheepAI City Issue Scraper/1.0" },
    customFields: {
      item: [["enclosure", "enclosure", { keepArray: false }]],
    },
  });

  // Snap to midnight so whole days are included (not cut off mid-day).
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - MAX_AGE_DAYS);
  cutoff.setHours(0, 0, 0, 0);

  const articles: ScrapedArticle[] = [];
  const errors: { source: string; error: string }[] = [];

  function processItem(item: Parser.Item, source: Source) {
    // Drop articles older than the cutoff window
    const pubDate = new Date(item.pubDate ?? item.isoDate ?? "");
    if (!isNaN(pubDate.getTime()) && pubDate < cutoff) return;

    const title = item.title ?? "";
    const rawDescription = item.contentSnippet ?? (item.content ? stripHtml(item.content) : "") ?? item.summary ?? "";
    const description = rawDescription.trim();
    const combined = title + " " + description;

    if (!source.splitFeed && !normalizeCroatian(combined).includes("split")) return;

    const hits = matchedKeywords(combined);
    if (hits.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyItem = item as any;
    const imageUrl: string | undefined = anyItem.enclosure?.url ?? anyItem["media:content"]?.$?.url ?? undefined;
    const anyContent: string = anyItem.content ?? "";
    const contentImageMatch = anyContent.match(/<img[^>]+src="([^"]+)"/);
    const resolvedImageUrl: string | undefined = imageUrl ?? contentImageMatch?.[1] ?? undefined;

    articles.push({
      title,
      description,
      url: item.link ?? "",
      publishedAt: item.pubDate ?? item.isoDate ?? new Date().toISOString(),
      source: source.name,
      imageUrl: resolvedImageUrl,
      matchedKeywords: [...new Set(hits)],
    });
  }

  await Promise.allSettled(
    SOURCES.map(async (source) => {
      const pageUrls = Array.from({ length: source.maxPages }, (_, i) => (i === 0 ? source.feed : `${source.feed}?paged=${i + 1}`));

      await Promise.allSettled(
        pageUrls.map(async (url) => {
          try {
            const feed = await parser.parseURL(url);
            for (const item of feed.items) {
              processItem(item, source);
            }
          } catch (err) {
            errors.push({
              source: source.name,
              error: `page ${url}: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        }),
      );
    }),
  );

  // Deduplicate by URL (pages can overlap)
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });

  unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return { articles: unique, errors };
}
