import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { scrapeAllSources } from "../lib/scrapers/rss";

async function main() {
  const { articles, errors } = await scrapeAllSources();

  for (const e of errors) console.warn(`[scrape] ${e.source}: ${e.error}`);

  const date = new Date().toISOString().slice(0, 10);
  const outPath = `data/news-scrape-${date}.json`;

  await mkdir("data", { recursive: true });
  await writeFile(outPath, JSON.stringify({ scrapedAt: new Date().toISOString(), count: articles.length, articles }, null, 2), "utf8");

  console.log(`Scraped ${articles.length} articles → ${outPath}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
