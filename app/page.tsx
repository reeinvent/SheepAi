'use client';

import { getSplitPosts } from './actions';
import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleScrape = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const result = await getSplitPosts();
      
      if (result.success) {
        setMessage(result.message || 'Scraping completed successfully!');
      } else {
        setError(result.message || result.error || 'Unknown error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black rounded-lg shadow-lg">
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-4xl font-bold text-black dark:text-white">
            SheepAi - Split Data Scraper
          </h1>
          
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
            Scrape Reddit data about Split, Croatia and save it to rawJson folder
          </p>

          <button
            onClick={handleScrape}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Scraping...' : 'Start Scraping'}
          </button>

          {message && (
            <div className="mt-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 rounded-lg">
              <p className="text-green-800 dark:text-green-100">{message}</p>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 rounded-lg">
              <p className="text-red-800 dark:text-red-100">{error}</p>
            </div>
          )}

          <div className="mt-8 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-left w-full">
            <h2 className="font-semibold text-black dark:text-white mb-2">How it works:</h2>
            <ul className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
              <li>✓ Scrapes r/Split subreddit for local issues</li>
              <li>✓ Filters by Croatian keywords (waste, water, electricity, etc.)</li>
              <li>✓ Fetches top comments for each post</li>
              <li>✓ Saves all data to rawJson/ folder with timestamp</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
