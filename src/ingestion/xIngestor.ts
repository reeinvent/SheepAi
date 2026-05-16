import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const X_API_BASE = "https://api.twitter.com/2/tweets/search/recent";

export const DEFAULT_TAGS = ["#split", "@split"] as const;

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

export interface XIngestResult {
  tag: string;
  query: string;
  fetchedAt: string;
  count: number;
  filePath: string;
  posts: XPost[];
}

export interface XIngestorOptions {
  tags?: readonly string[];
  bearerToken?: string;
  outputDir?: string;
  maxPages?: number;
  maxResultsPerPage?: number;
  fetchImpl?: typeof fetch;
}

interface RawTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  lang?: string;
  public_metrics?: XPost["metrics"];
  entities?: {
    hashtags?: { tag: string }[];
    mentions?: { username: string }[];
    urls?: { expanded_url?: string; url: string }[];
  };
}

interface RawUser {
  id: string;
  username: string;
  name: string;
}

interface RawResponse {
  data?: RawTweet[];
  includes?: { users?: RawUser[] };
  meta?: { next_token?: string; result_count?: number };
  title?: string;
  detail?: string;
}

export class XIngestor {
  private readonly tags: readonly string[];
  private readonly bearerToken: string;
  private readonly outputDir: string;
  private readonly maxPages: number;
  private readonly maxResultsPerPage: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: XIngestorOptions = {}) {
    this.tags = options.tags?.length ? options.tags : DEFAULT_TAGS;
    const token = options.bearerToken ?? process.env.X_BEARER_TOKEN;
    if (!token) {
      throw new Error(
        "X_BEARER_TOKEN is required. Set it in your environment or pass bearerToken to XIngestor.",
      );
    }
    this.bearerToken = token;
    this.outputDir = options.outputDir ?? "data/x";
    this.maxPages = options.maxPages ?? 5;
    this.maxResultsPerPage = Math.min(Math.max(options.maxResultsPerPage ?? 100, 10), 100);
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async run(): Promise<XIngestResult[]> {
    const results: XIngestResult[] = [];
    for (const tag of this.tags) {
      results.push(await this.ingestTag(tag));
    }
    return results;
  }

  async ingestTag(tag: string): Promise<XIngestResult> {
    const query = buildQuery(tag);
    const posts = await this.fetchAllPages(query);
    const fetchedAt = new Date().toISOString();
    const filePath = await this.save(tag, query, fetchedAt, posts);
    return { tag, query, fetchedAt, count: posts.length, filePath, posts };
  }

  async fetchTag(tag: string): Promise<XPost[]> {
    return this.fetchAllPages(buildQuery(tag));
  }

  private async fetchAllPages(query: string): Promise<XPost[]> {
    const collected: XPost[] = [];
    let nextToken: string | undefined;
    for (let page = 0; page < this.maxPages; page++) {
      const { posts, next } = await this.fetchPage(query, nextToken);
      collected.push(...posts);
      if (!next) break;
      nextToken = next;
    }
    return collected;
  }

  private async fetchPage(
    query: string,
    nextToken?: string,
  ): Promise<{ posts: XPost[]; next?: string }> {
    const url = new URL(X_API_BASE);
    url.searchParams.set("query", query);
    url.searchParams.set("max_results", String(this.maxResultsPerPage));
    url.searchParams.set(
      "tweet.fields",
      "id,text,author_id,created_at,public_metrics,entities,lang",
    );
    url.searchParams.set("expansions", "author_id");
    url.searchParams.set("user.fields", "username,name");
    if (nextToken) url.searchParams.set("next_token", nextToken);

    const res = await this.fetchImpl(url.toString(), {
      headers: { Authorization: `Bearer ${this.bearerToken}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `X API error ${res.status} ${res.statusText} for query "${query}": ${body}`,
      );
    }

    const raw = (await res.json()) as RawResponse;
    if (!raw.data || raw.data.length === 0) {
      return { posts: [], next: undefined };
    }

    const userMap = new Map<string, RawUser>();
    for (const u of raw.includes?.users ?? []) userMap.set(u.id, u);

    const posts: XPost[] = raw.data.map((t) => {
      const user = userMap.get(t.author_id);
      return {
        id: t.id,
        text: t.text,
        authorId: t.author_id,
        authorUsername: user?.username,
        authorName: user?.name,
        createdAt: t.created_at,
        lang: t.lang,
        metrics: t.public_metrics,
        hashtags: (t.entities?.hashtags ?? []).map((h) => h.tag),
        mentions: (t.entities?.mentions ?? []).map((m) => m.username),
        urls: (t.entities?.urls ?? []).map((u) => u.expanded_url ?? u.url),
      };
    });

    return { posts, next: raw.meta?.next_token };
  }

  private async save(
    tag: string,
    query: string,
    fetchedAt: string,
    posts: XPost[],
  ): Promise<string> {
    const dir = join(this.outputDir, sanitizeTag(tag));
    await mkdir(dir, { recursive: true });
    const filename = `${fetchedAt.replace(/[:.]/g, "-")}.json`;
    const filePath = join(dir, filename);
    const payload = { tag, query, fetchedAt, count: posts.length, posts };
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    return filePath;
  }
}

function buildQuery(tag: string): string {
  return tag.trim();
}

function sanitizeTag(tag: string): string {
  return tag.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/^_+|_+$/g, "") || "tag";
}
