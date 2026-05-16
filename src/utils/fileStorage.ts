import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { CleanedPost } from '@/src/ingestion/redditScrapper/redditScraper';

const RAW_JSON_DIR = join(process.cwd(), 'rawJson');

/**
 * Ensures the rawJson directory exists
 */
async function ensureRawJsonDir(): Promise<void> {
  try {
    await mkdir(RAW_JSON_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating rawJson directory:', error);
  }
}

/**
 * Saves data to a JSON file in the rawJson folder
 * @param filename - Name of the file (without .json extension)
 * @param data - Data to save
 * @returns Path to the saved file
 */
export async function saveToRawJson(filename: string, data: any): Promise<string> {
  try {
    await ensureRawJsonDir();
    
    const filepath = join(RAW_JSON_DIR, `${filename}.json`);
    const jsonData = JSON.stringify(data, null, 2);
    
    await writeFile(filepath, jsonData, 'utf-8');
    
    console.log(`Data saved to ${filepath}`);
    return filepath;
  } catch (error) {
    console.error(`Error saving to ${filename}.json:`, error);
    throw error;
  }
}

/**
 * Saves cleaned Reddit posts with timestamp
 */
export async function saveRedditPosts(posts: CleanedPost[], source: string = 'split'): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `reddit-${source}-${timestamp}`;
  
  const data = {
    source,
    timestamp: new Date().toISOString(),
    count: posts.length,
    posts,
  };
  
  return saveToRawJson(filename, data);
}
