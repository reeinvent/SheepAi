'use server';

import { searchSplitCroatia } from '@/src/ingestion/redditScrapper/redditScraper';
import { saveRedditPosts } from '@/src/utils/fileStorage';

export async function getSplitPosts() {
  try {
    const posts = await searchSplitCroatia(25);
    
    // Save to rawJson folder
    const filepath = await saveRedditPosts(posts, 'split');
    
    return { 
      success: true, 
      message: `Scraped ${posts.length} posts and saved to ${filepath}`,
      filepath 
    };
  } catch (error) {
    console.error('Error fetching Split posts:', error);
    return { 
      success: false, 
      error: 'Failed to fetch posts',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
