/**
 * Fisher-Yates shuffle — returns a new array.
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Scramble a word. Retries up to 10 times to avoid returning the original.
 */
export function scrambleWord(word: string): string {
  const letters = word.split("");
  for (let attempts = 0; attempts < 10; attempts++) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    if (letters.join("") !== word) break;
  }
  return letters.join("");
}
