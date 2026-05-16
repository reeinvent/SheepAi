import { CITY_KEYWORDS } from '../keywords';
import { cleanText, isValidText } from '@/src/utils/textCleaner';

interface RedditComment {
  id: string;
  body: string;
  author: string;
  score: number;
  created_utc: number;
}

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  author: string;
  created_utc: number;
  url: string;
  permalink: string;
  subreddit: string;
  score: number;
  comments?: RedditComment[];
}

// Cleaned data structure for LLM processing
export interface CleanedPost {
  title: string;
  content: string;
  comments: string[];
  score: number;
  timestamp: number;
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
    after: string | null;
    before: string | null;
  };
}

// Rate limiting helper
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

async function rateLimitedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => 
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return fetch(url, options);
}

// Helper function to fetch comments for a post
async function fetchPostComments(
  subreddit: string,
  postId: string,
  limit: number = 10
): Promise<RedditComment[]> {
  const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${limit}&sort=top`;

  try {
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'SheepAi/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    // Comments are in the second element of the array
    const commentsData = data[1]?.data?.children || [];
    
    return commentsData
      .filter((child: any) => child.kind === 't1') // t1 = comment
      .map((child: any) => ({
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

export async function searchReddit(
  query: string,
  subreddit?: string,
  limit: number = 25
): Promise<RedditPost[]> {
  const baseUrl = subreddit
    ? `https://www.reddit.com/r/${subreddit}/search.json`
    : 'https://www.reddit.com/search.json';

  const params = new URLSearchParams({
    q: query,
    restrict_sr: subreddit ? 'on' : 'off',
    sort: 'relevance',
    limit: limit.toString(),
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'SheepAi/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data: RedditResponse = await response.json();
    return data.data.children.map((child) => child.data);
  } catch (error) {
    console.error('Error fetching from Reddit:', error);
    throw error;
  }
}

export async function getSubredditPosts(
  subreddit: string,
  limit: number = 25
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;

  try {
    const response = await rateLimitedFetch(url, {
      headers: {
        'User-Agent': 'SheepAi/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data: RedditResponse = await response.json();
    return data.data.children.map((child) => child.data);
  } catch (error) {
    console.error('Error fetching subreddit posts:', error);
    throw error;
  }
}

// Helper function to convert raw post to cleaned post for LLM
function cleanPost(post: RedditPost): CleanedPost | null {
  const title = cleanText(post.title);
  const content = cleanText(post.selftext);
  
  // Only include if there's meaningful content
  if (!isValidText(title) && !isValidText(content)) {
    return null;
  }
  
  const comments = (post.comments || [])
    .map(comment => cleanText(comment.body))
    .filter(text => isValidText(text, 5)); // Minimum 5 chars for comments
  
  return {
    title: title || '(No title)',
    content: content || '(No content)',
    comments,
    score: post.score,
    timestamp: post.created_utc,
  };
}

// Helper function to filter out irrelevant posts using Croatian keywords
function isRelevantToSplit(post: RedditPost): boolean {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  
  // Check if post contains at least one Croatian city keyword
  const hasLocalKeyword = CITY_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  // Also accept posts from r/Split subreddit directly
  const isFromSplitSub = post.subreddit.toLowerCase() === 'split';
  
  return hasLocalKeyword || isFromSplitSub;
}

// Helper function to search for Split, Croatia specific info
export async function searchSplitCroatia(limit: number = 25, includeComments: boolean = true): Promise<CleanedPost[]> {
  const allPosts: RedditPost[] = [];
  const seenIds = new Set<string>();

  // Primary source: r/Split subreddit directly
  try {
    const splitSubPosts = await getSubredditPosts('Split', limit);
    for (const post of splitSubPosts) {
      if (!seenIds.has(post.id) && isRelevantToSplit(post)) {
        seenIds.add(post.id);
        
        // Fetch comments if requested
        if (includeComments) {
          post.comments = await fetchPostComments(post.subreddit, post.id, 5);
        }
        
        allPosts.push(post);
      }
    }
  } catch (error) {
    console.error('Error fetching from r/Split:', error);
  }

  // If we don't have enough posts, try r/croatia
  if (allPosts.length < limit) {
    try {
      const croatiaPosts = await getSubredditPosts('croatia', Math.ceil(limit / 2));
      for (const post of croatiaPosts) {
        if (!seenIds.has(post.id) && isRelevantToSplit(post)) {
          seenIds.add(post.id);
          
          // Fetch comments if requested
          if (includeComments) {
            post.comments = await fetchPostComments(post.subreddit, post.id, 5);
          }
          
          allPosts.push(post);
        }
      }
    } catch (error) {
      console.error('Error fetching from r/croatia:', error);
    }
  }

  // Convert to cleaned posts and filter out empty ones
  const cleanedPosts = allPosts
    .map(post => cleanPost(post))
    .filter((post): post is CleanedPost => post !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return cleanedPosts;
}
