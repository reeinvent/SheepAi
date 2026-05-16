/**
 * Removes URLs and links from text
 */
function removeUrls(text: string): string {
  return text
    .replace(/https?:\/\/[^\s]+/g, '') // Remove http/https URLs
    .replace(/www\.[^\s]+/g, '') // Remove www URLs
    .replace(/r\/\w+/g, '') // Remove subreddit references like r/Split
    .replace(/u\/\w+/g, ''); // Remove user mentions like u/username
}

/**
 * Removes markdown formatting
 */
function removeMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert [text](url) to text
    .replace(/\*\*([^\*]+)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*([^\*]+)\*/g, '$1') // Remove italic *text*
    .replace(/__([^_]+)__/g, '$1') // Remove bold __text__
    .replace(/_([^_]+)_/g, '$1') // Remove italic _text_
    .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough ~~text~~
    .replace(/`([^`]+)`/g, '$1') // Remove inline code `text`
    .replace(/```[\s\S]*?```/g, ''); // Remove code blocks
}

/**
 * Removes extra whitespace and normalizes text
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\n\n+/g, '\n') // Remove multiple newlines
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
}

/**
 * Removes common Reddit artifacts and metadata
 */
function removeRedditArtifacts(text: string): string {
  return text
    .replace(/^(Edit|EDIT|Update|UPDATE):.*/gm, '') // Remove edit notes
    .replace(/^(TL;DR|TLDR):.*/gm, '') // Remove TL;DR
    .replace(/\[deleted\]/g, '') // Remove deleted markers
    .replace(/\[removed\]/g, '') // Remove removed markers
    .replace(/^(Thanks for the gold|Thanks for the award).*$/gm, '') // Remove award thanks
    .replace(/^(Disclaimer|Note):.*$/gm, ''); // Remove disclaimers
}

/**
 * Main text cleaning function
 */
export function cleanText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  cleaned = removeUrls(cleaned);
  cleaned = removeMarkdown(cleaned);
  cleaned = removeRedditArtifacts(cleaned);
  cleaned = normalizeWhitespace(cleaned);
  
  return cleaned;
}

/**
 * Filters out very short or empty text
 */
export function isValidText(text: string, minLength: number = 10): boolean {
  const cleaned = cleanText(text);
  return cleaned.length >= minLength;
}
