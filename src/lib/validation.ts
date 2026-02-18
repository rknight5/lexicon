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

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI response was not valid JSON — please retry");
  }

  const obj = parsed as Record<string, unknown>;

  // Validate shape
  if (!obj.title || typeof obj.title !== "string") {
    throw new Error("Missing or invalid 'title' field");
  }
  if (!Array.isArray(obj.words) || obj.words.length === 0) {
    throw new Error("Missing or empty 'words' array");
  }
  for (const word of obj.words) {
    if (!word.word || !word.clue || !word.category || !word.difficulty) {
      throw new Error(`Invalid word entry: ${JSON.stringify(word)}`);
    }
  }

  return obj as unknown as PuzzleContent;
}

export function validateAndFilterWords(
  words: WordEntry[],
  config: { minWords: number; maxWords: number; minWordLength?: number; maxWordLength?: number; focusCategories: string[] }
): WordEntry[] {
  const minLen = config.minWordLength ?? 3;
  const maxLen = config.maxWordLength ?? 12;
  const normalizedCategories = config.focusCategories.map((c) => c.toLowerCase());
  return words
    .map((w) => ({
      ...w,
      word: w.word.toUpperCase().replace(/[^A-Z]/g, ""),
    }))
    .filter((w) => w.word.length >= minLen && w.word.length <= maxLen)
    .filter((w, i, arr) => arr.findIndex((x) => x.word === w.word) === i)
    .filter((w) => normalizedCategories.includes(w.category.toLowerCase()))
    .slice(0, config.maxWords);
}
