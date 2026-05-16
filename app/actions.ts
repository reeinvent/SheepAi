'use server';

import { searchSplitCroatia } from '@/src/ingestion/redditScraper';

export async function getSplitPosts() {
  try {
    const posts = await searchSplitCroatia(25);
    return { success: true, posts };
  } catch (error) {
    console.error('Error fetching Split posts:', error);
    return { success: false, error: 'Failed to fetch posts', posts: [] };
  }
}
