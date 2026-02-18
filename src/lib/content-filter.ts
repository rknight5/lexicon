import { Filter } from "bad-words";

let filter: Filter | null = null;
try {
  filter = new Filter();
} catch {
  // Permissive fallback — if bad-words fails to load, allow all content through
  console.error("Failed to initialize profanity filter");
}

/**
 * Check if a string contains profane/inappropriate content.
 */
export function isProfane(text: string): boolean {
  if (!filter || !text.trim()) return false;
  try {
    return filter.isProfane(text);
  } catch {
    return false;
  }
}

/**
 * Check if any string in an array contains profanity.
 * Returns true if ANY item is profane.
 */
export function containsProfanity(texts: string[]): boolean {
  return texts.some((t) => isProfane(t));
}

/**
 * Filter an array of items, removing any where the extracted text is profane.
 */
export function filterProfaneItems<T>(
  items: T[],
  textExtractor: (item: T) => string[]
): T[] {
  if (!filter) return items;
  return items.filter((item) => {
    const texts = textExtractor(item);
    return !texts.some((t) => isProfane(t));
  });
}
