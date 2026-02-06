import type { WordEntry } from "./types";

interface PuzzleContent {
  title: string;
  words: WordEntry[];
  funFact: string;
}

export function parseClaudeResponse(rawText: string): PuzzleContent {
  let cleaned = rawText.trim();

  // Strip markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  // Find first '{' (skip preamble text)
  const jsonStart = cleaned.indexOf("{");
  if (jsonStart > 0) {
    cleaned = cleaned.slice(jsonStart);
  }

  // Find matching closing brace
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonEnd >= 0) {
    cleaned = cleaned.slice(0, jsonEnd + 1);
  }

  const parsed = JSON.parse(cleaned);

  // Validate shape
  if (!parsed.title || typeof parsed.title !== "string") {
    throw new Error("Missing or invalid 'title' field");
  }
  if (!Array.isArray(parsed.words) || parsed.words.length === 0) {
    throw new Error("Missing or empty 'words' array");
  }
  for (const word of parsed.words) {
    if (!word.word || !word.clue || !word.category || !word.difficulty) {
      throw new Error(`Invalid word entry: ${JSON.stringify(word)}`);
    }
  }

  return parsed as PuzzleContent;
}

export function validateAndFilterWords(
  words: WordEntry[],
  config: { minWords: number; maxWords: number; focusCategories: string[] }
): WordEntry[] {
  return words
    .map((w) => ({
      ...w,
      word: w.word.toUpperCase().replace(/[^A-Z]/g, ""),
    }))
    .filter((w) => w.word.length >= 3 && w.word.length <= 12)
    .filter((w, i, arr) => arr.findIndex((x) => x.word === w.word) === i)
    .filter((w) => config.focusCategories.includes(w.category))
    .slice(0, config.maxWords);
}
