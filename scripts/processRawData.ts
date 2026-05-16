import * as fs from "fs";
import * as path from "path";

interface RedditItem {
  id: string;
  title: string;
  body: string;
  author: string;
  subreddit: string;
  score: number;
  createdAt: string;
  permalink: string;
  url: string;
  comments: any[];
  matchedKeywords?: string[];
}

interface XPost {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  createdAt: string;
  lang: string;
  metrics: any;
  hashtags: string[];
  mentions: string[];
  urls: string[];
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl: string;
  matchedKeywords?: string[];
}

interface RedditOutput {
  dataSource: "reddit";
  summary: string;
  timestamp: string;
  metadata: {
    postId: string;
    author: string;
    subreddit: string;
    permalink: string;
    originalTitle: string;
    originalBody: string;
    score: number;
  };
}

interface XOutput {
  dataSource: "x";
  summary: string;
  timestamp: string;
  metadata: {
    postId: string;
    authorUsername: string;
    sourceTag: string;
    originalText: string;
    lang: string;
    urls: string[];
  };
}

interface NewsOutput {
  dataSource: string;
  summary: string;
  timestamp: string;
  metadata: {
    url: string;
    source: string;
    title: string;
    category: string;
    severity: string;
    matchedKeywords: string[];
  };
}

// Civic issue keywords for filtering
const REDDIT_CIVIC_KEYWORDS = [
  "rasvjeta",
  "javna rasvjeta",
  "šaht",
  "manhole",
  "cesta",
  "put",
  "parking",
  "parkiranje",
  "otpad",
  "voda",
  "kanalizacija",
  "javni prijevoz",
  "tramvaj",
  "autobus",
];

const X_CIVIC_KEYWORDS = [
  "rasvjeta",
  "javna rasvjeta",
  "šaht",
  "manhole",
  "cesta",
  "put",
  "parking",
  "parkiranje",
];

const NEWS_CIVIC_KEYWORDS = [
  "cesta",
  "put",
  "otpad",
  "komunalni",
  "komunalna",
  "voda",
  "kanalizacija",
  "struja",
  "električna",
  "buka",
  "bespravna gradnja",
  "bespravno",
  "more",
  "zagađenje",
  "poplava",
  "infrastruktura",
  "odvodnja",
  "vodoopskrb",
  "vodovod",
];

function isRedditCivicIssue(item: RedditItem): boolean {
  const text = (
    item.title +
    " " +
    item.body +
    " " +
    (item.matchedKeywords?.join(" ") || "")
  ).toLowerCase();

  // Check if it contains civic keywords
  const hasCivicKeyword = REDDIT_CIVIC_KEYWORDS.some((kw) =>
    text.includes(kw.toLowerCase())
  );

  if (!hasCivicKeyword) return false;

  // Exclude certain topics
  const excludeKeywords = [
    "hajduk",
    "sport",
    "politika",
    "vijest",
    "news",
    "turizm",
    "restoran",
    "bar",
    "nekretnina",
    "vic",
    "meme",
  ];
  const shouldExclude = excludeKeywords.some((kw) =>
    text.includes(kw.toLowerCase())
  );

  return !shouldExclude;
}

function isXCivicIssue(post: XPost): boolean {
  const text = (post.text + " " + post.hashtags.join(" ")).toLowerCase();

  // Check if it contains civic keywords
  const hasCivicKeyword = X_CIVIC_KEYWORDS.some((kw) =>
    text.includes(kw.toLowerCase())
  );

  if (!hasCivicKeyword) return false;

  // Exclude certain topics
  const excludeKeywords = [
    "hajduk",
    "sport",
    "turizm",
    "restoran",
    "bar",
    "devlife",
    "javascript",
    "code",
    "vic",
    "meme",
  ];
  const shouldExclude = excludeKeywords.some((kw) =>
    text.includes(kw.toLowerCase())
  );

  return !shouldExclude;
}

function isNewsCivicIssue(article: NewsArticle): boolean {
  const text = (
    article.title +
    " " +
    article.description +
    " " +
    (article.matchedKeywords?.join(" ") || "")
  ).toLowerCase();

  // Check if it contains civic keywords
  const hasCivicKeyword = NEWS_CIVIC_KEYWORDS.some((kw) =>
    text.includes(kw.toLowerCase())
  );

  if (!hasCivicKeyword) return false;

  // Exclude certain topics
  const excludeKeywords = [
    "sport",
    "hajduk",
    "politika",
    "turizm",
    "restoran",
    "bar",
    "kultura",
    "događaj",
    "event",
  ];
  const shouldExclude = excludeKeywords.some((kw) =>
    text.includes(kw.toLowerCase())
  );

  return !shouldExclude;
}

function detectLanguage(text: string): string {
  // Simple language detection based on common words
  const croatianWords = [
    "je",
    "i",
    "na",
    "u",
    "za",
    "od",
    "da",
    "se",
    "što",
    "koji",
    "koji",
    "gdje",
    "kada",
    "kako",
  ];
  const englishWords = [
    "the",
    "is",
    "and",
    "to",
    "of",
    "a",
    "in",
    "that",
    "it",
    "for",
    "has",
    "been",
  ];

  const lowerText = text.toLowerCase();
  let croatianCount = 0;
  let englishCount = 0;

  for (const word of croatianWords) {
    if (lowerText.includes(word)) croatianCount++;
  }
  for (const word of englishWords) {
    if (lowerText.includes(word)) englishCount++;
  }

  return englishCount > croatianCount ? "en" : "hr";
}

function translateToCroatian(text: string): string {
  // Simple mapping for common civic issue descriptions
  const translations: { [key: string]: string } = {
    "street light": "javna rasvjeta",
    "street lights": "javne rasvjete",
    "flickering": "treperi",
    "broken": "slomljena",
    "damaged": "oštećena",
    "missing": "nedostaje",
    "manhole cover": "poklopac šahta",
    "road": "cesta",
    "parking": "parkiranje",
    "illegal parking": "nepropisno parkiranje",
    "parking shortage": "nedostatak parkirnih mjesta",
    "waste": "otpad",
    "water": "voda",
    "sewage": "kanalizacija",
    "public transit": "javni prijevoz",
    "not working": "ne radi",
    "not fixed": "nije popravljena",
    "three weeks": "tri tjedna",
    "alley": "ulica",
    "goes dark": "postaje mračna",
    "tourists": "turisti",
    "bumping into": "udaraju se u",
    "bins": "kontejnere",
  };

  if (detectLanguage(text) === "hr") {
    return text;
  }

  // For English text, do simple word replacements
  let translated = text.toLowerCase();
  for (const [eng, hr] of Object.entries(translations)) {
    translated = translated.replace(new RegExp(eng, "gi"), hr);
  }

  // Capitalize first letter
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

function processRedditFiles(): RedditOutput[] {
  const redditDir = "/Users/ivorgradinski/Desktop/Projects/SheepAi/data/raw/reddit";
  const files = fs
    .readdirSync(redditDir)
    .filter((f) => f.endsWith(".json") && !f.includes("INSTRUCTIONS"));

  const allOutputs: RedditOutput[] = [];

  for (const file of files) {
    const filePath = path.join(redditDir, file);
    const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const outputs: RedditOutput[] = [];

    for (const item of rawData.items) {
      if (isRedditCivicIssue(item)) {
        const summary = `${item.title}${item.body ? " - " + item.body.substring(0, 100) : ""}`;

        outputs.push({
          dataSource: "reddit",
          summary: translateToCroatian(summary),
          timestamp: item.createdAt,
          metadata: {
            postId: item.id,
            author: item.author,
            subreddit: item.subreddit,
            permalink: item.permalink,
            originalTitle: item.title,
            originalBody: item.body,
            score: item.score,
          },
        });
      }
    }

    // Write output file
    const outputDir = "/Users/ivorgradinski/Desktop/Projects/SheepAi/data/llm-out/reddit";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, file);
    fs.writeFileSync(outputFile, JSON.stringify(outputs, null, 2));

    // Delete raw file
    fs.unlinkSync(filePath);

    allOutputs.push(...outputs);
  }

  return allOutputs;
}

function processXFiles(): XOutput[] {
  const xDir = "/Users/ivorgradinski/Desktop/Projects/SheepAi/data/raw/x";
  const files = fs
    .readdirSync(xDir)
    .filter((f) => f.endsWith(".json") && !f.includes("INSTRUCTIONS"));

  const allOutputs: XOutput[] = [];

  for (const file of files) {
    const filePath = path.join(xDir, file);
    const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const outputs: XOutput[] = [];

    for (const post of rawData.items) {
      if (isXCivicIssue(post)) {
        outputs.push({
          dataSource: "x",
          summary: translateToCroatian(post.text),
          timestamp: post.createdAt,
          metadata: {
            postId: post.id,
            authorUsername: post.authorUsername,
            sourceTag: rawData.source,
            originalText: post.text,
            lang: post.lang,
            urls: post.urls,
          },
        });
      }
    }

    // Write output file
    const outputDir = "/Users/ivorgradinski/Desktop/Projects/SheepAi/data/llm-out/x";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, file);
    fs.writeFileSync(outputFile, JSON.stringify(outputs, null, 2));

    // Delete raw file
    fs.unlinkSync(filePath);

    allOutputs.push(...outputs);
  }

  return allOutputs;
}

function processNewsFiles(): NewsOutput[] {
  const newsDir = "/Users/ivorgradinski/Desktop/Projects/SheepAi/data/raw/news";
  const files = fs
    .readdirSync(newsDir)
    .filter((f) => f.endsWith(".json") && !f.includes("INSTRUCTIONS"));

  const allOutputs: NewsOutput[] = [];

  for (const file of files) {
    const filePath = path.join(newsDir, file);
    const rawData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const outputs: NewsOutput[] = [];

    for (const article of rawData.items) {
      if (isNewsCivicIssue(article)) {
        // Determine category based on keywords
        let category = "other";
        const text = (
          article.title +
          " " +
          article.description
        ).toLowerCase();

        if (
          text.includes("cesta") ||
          text.includes("put") ||
          text.includes("kolnik")
        ) {
          category = "roads";
        } else if (text.includes("otpad") || text.includes("komunalni")) {
          category = "waste";
        } else if (
          text.includes("voda") ||
          text.includes("kanalizacija") ||
          text.includes("vodovod")
        ) {
          category = "water";
        } else if (
          text.includes("struja") ||
          text.includes("električna")
        ) {
          category = "electricity";
        } else if (text.includes("buka")) {
          category = "noise";
        } else if (
          text.includes("bespravna gradnja") ||
          text.includes("bespravno")
        ) {
          category = "construction";
        } else if (
          text.includes("javni prijevoz") ||
          text.includes("tramvaj")
        ) {
          category = "transport";
        } else if (text.includes("zelenilo")) {
          category = "green";
        }

        // Determine severity
        let severity = "low";
        if (
          text.includes("katastrofa") ||
          text.includes("ozbiljna") ||
          text.includes("opasna")
        ) {
          severity = "high";
        } else if (
          text.includes("problem") ||
          text.includes("oštećena") ||
          text.includes("slomljena")
        ) {
          severity = "medium";
        }

        // Parse timestamp
        const pubDate = new Date(article.publishedAt);
        const timestamp = pubDate.toISOString();

        outputs.push({
          dataSource: article.source,
          summary: translateToCroatian(article.description || article.title),
          timestamp: timestamp,
          metadata: {
            url: article.url,
            source: article.source,
            title: article.title,
            category: category,
            severity: severity,
            matchedKeywords: article.matchedKeywords || [],
          },
        });
      }
    }

    // Write output file
    const outputDir = "/Users/ivorgradinski/Desktop/Projects/SheepAi/data/llm-out/news";
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, file);
    fs.writeFileSync(outputFile, JSON.stringify(outputs, null, 2));

    // Delete raw file
    fs.unlinkSync(filePath);

    allOutputs.push(...outputs);
  }

  return allOutputs;
}

async function main() {
  console.log("Processing raw data files...\n");

  console.log("Processing Reddit files...");
  const redditOutputs = processRedditFiles();
  console.log(`✓ Processed Reddit: ${redditOutputs.length} civic issues found\n`);

  console.log("Processing X files...");
  const xOutputs = processXFiles();
  console.log(`✓ Processed X: ${xOutputs.length} civic issues found\n`);

  console.log("Processing News files...");
  const newsOutputs = processNewsFiles();
  console.log(`✓ Processed News: ${newsOutputs.length} civic issues found\n`);

  console.log("=== Summary ===");
  console.log(`Reddit: ${redditOutputs.length} issues`);
  console.log(`X: ${xOutputs.length} issues`);
  console.log(`News: ${newsOutputs.length} issues`);
  console.log(
    `Total: ${redditOutputs.length + xOutputs.length + newsOutputs.length} issues`
  );
}

main().catch(console.error);
