import { Filter } from "bad-words";

const filter = new Filter();

/**
 * Check if a string contains profane/inappropriate content.
 */
export function isProfane(text: string): boolean {
  if (!text.trim()) return false;
  return filter.isProfane(text);
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
  return items.filter((item) => {
    const texts = textExtractor(item);
    return !texts.some((t) => isProfane(t));
  });
}
