import { CITY_KEYWORDS } from "../keywords";
import { cleanText, isValidText } from "@/src/utils/textCleaner";

// Low-level Reddit fetch helpers + the source-specific raw item shape that
// `RedditIngestor` stages to `data/raw/reddit/`. Stays narrow on purpose:
// network + light normalization only. Filtering, summarization, and ticket
// shaping happen in the LLM and promoter stages downstream.

interface RawRedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
}

interface RawRedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  url: string;
  permalink: string;
  subreddit: string;
  score: number;
  comments?: RawRedditComment[];
}

interface RedditListingResponse {
  data: {
    children: Array<{ data: RawRedditPost }>;
    after: string | null;
    before: string | null;
  };
}

interface RedditCommentChild {
  kind: string;
  data: RawRedditComment;
}

// Source-specific raw item the LLM stage will read out of `data/raw/reddit/`.
// Shape mirrors what's useful for civic-issue triage: identity, attribution,
// engagement signal, locatable text, plus a permalink so we can deep-link
// back to the original post from a ticket.
export interface RedditCommentItem {
  id: string;
  author: string;
  body: string;
  score: number;
  createdAt: string;
}

export interface RedditItem {
  id: string;
  title: string;
  body: string;
  author: string;
  subreddit: string;
  score: number;
  createdAt: string;
  permalink: string;
  url: string;
  comments: RedditCommentItem[];
}

// Reddit's public JSON endpoints are unauthenticated but rate-limited per IP.
// One global gate keeps interleaved post/comment fetches from clustering and
// tripping a 429.
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 2000;

async function rateLimitedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL_MS - elapsed),
    );
  }
  lastRequestTime = Date.now();
  return fetch(url, options);
}

async function getSubredditPosts(
  subreddit: string,
  limit: number,
): Promise<RawRedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
  const response = await rateLimitedFetch(url, {
    headers: { "User-Agent": "SheepAi/1.0" },
  });
  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }
  const data = (await response.json()) as RedditListingResponse;
  return data.data.children.map((child) => child.data);
}

async function fetchPostComments(
  subreddit: string,
  postId: string,
  limit: number,
): Promise<RawRedditComment[]> {
  const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${limit}&sort=top`;
  try {
    const response = await rateLimitedFetch(url, {
      headers: { "User-Agent": "SheepAi/1.0" },
    });
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    const data = (await response.json()) as [
      unknown,
      { data?: { children?: RedditCommentChild[] } },
    ];
    const children = data[1]?.data?.children ?? [];
    return children
      .filter((child) => child.kind === "t1")
      .map((child) => ({
        id: child.data.id,
        body: child.data.body,
        author: child.data.author,
        score: child.data.score,
        created_utc: child.data.created_utc,
      }));
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error);
    return [];
  }
}

function isRelevantToSplit(post: RawRedditPost): boolean {
  // r/Split is curated enough that we accept everything; for broader
  // subreddits we require at least one Croatian civic keyword to keep raw
  // staging from filling up with unrelated content.
  if (post.subreddit.toLowerCase() === "split") return true;
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  return CITY_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

function toIso(createdUtc: number): string {
  return new Date(createdUtc * 1000).toISOString();
}

function toRedditItem(post: RawRedditPost): RedditItem | null {
  const title = cleanText(post.title);
  const body = cleanText(post.selftext);
  // Keep posts whose title OR body has substance after stripping markdown
  // and Reddit artifacts. Posts that collapse to nothing are pure link/meme.
  if (!isValidText(title) && !isValidText(body)) return null;

  const comments = (post.comments ?? [])
    .map<RedditCommentItem | null>((c) => {
      const cleaned = cleanText(c.body);
      if (!isValidText(cleaned, 5)) return null;
      return {
        id: c.id,
        author: c.author,
        body: cleaned,
        score: c.score,
        createdAt: toIso(c.created_utc),
      };
    })
    .filter((c): c is RedditCommentItem => c !== null);

  return {
    id: post.id,
    title: title || "(No title)",
    body,
    author: post.author,
    subreddit: post.subreddit,
    score: post.score,
    createdAt: toIso(post.created_utc),
    permalink: `https://www.reddit.com${post.permalink}`,
    url: post.url,
    comments,
  };
}

export interface FetchSubredditOptions {
  limit: number;
  includeComments: boolean;
  commentsPerPost?: number;
}

export async function fetchSubredditItems(
  subreddit: string,
  options: FetchSubredditOptions,
): Promise<RedditItem[]> {
  const posts = await getSubredditPosts(subreddit, options.limit);
  const kept = posts.filter(isRelevantToSplit);

  if (options.includeComments) {
    for (const post of kept) {
      post.comments = await fetchPostComments(
        post.subreddit,
        post.id,
        options.commentsPerPost ?? 5,
      );
    }
  }

  return kept
    .map((p) => toRedditItem(p))
    .filter((item): item is RedditItem => item !== null);
}
