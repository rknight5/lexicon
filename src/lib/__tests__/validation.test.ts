import { describe, it, expect } from "vitest";
import { parseClaudeResponse, validateAndFilterWords } from "../validation";

describe("parseClaudeResponse", () => {
  it("parses clean JSON", () => {
    const input = JSON.stringify({
      title: "Test Puzzle",
      words: [{ word: "HELLO", clue: "A greeting", category: "Basics", difficulty: 1 }],
      funFact: "Fun fact here",
    });
    const result = parseClaudeResponse(input);
    expect(result.title).toBe("Test Puzzle");
    expect(result.words).toHaveLength(1);
  });

  it("strips markdown code fences", () => {
    const json = JSON.stringify({
      title: "Test",
      words: [{ word: "A", clue: "B", category: "C", difficulty: 1 }],
      funFact: "F",
    });
    const input = "```json\n" + json + "\n```";
    const result = parseClaudeResponse(input);
    expect(result.title).toBe("Test");
  });

  it("handles preamble text before JSON", () => {
    const json = JSON.stringify({
      title: "Test",
      words: [{ word: "A", clue: "B", category: "C", difficulty: 1 }],
      funFact: "F",
    });
    const input = "Here is the puzzle:\n" + json;
    const result = parseClaudeResponse(input);
    expect(result.title).toBe("Test");
  });

  it("throws on missing title", () => {
    const input = JSON.stringify({ words: [], funFact: "F" });
    expect(() => parseClaudeResponse(input)).toThrow("title");
  });

  it("throws on empty words array", () => {
    const input = JSON.stringify({ title: "T", words: [], funFact: "F" });
    expect(() => parseClaudeResponse(input)).toThrow("words");
  });

  it("throws on invalid word entry (missing fields)", () => {
    const input = JSON.stringify({
      title: "T",
      words: [{ word: "A" }],
      funFact: "F",
    });
    expect(() => parseClaudeResponse(input)).toThrow("Invalid word entry");
  });
});

describe("validateAndFilterWords", () => {
  const makeWord = (word: string, category = "General") => ({
    word,
    clue: "test",
    category,
    difficulty: 1 as const,
  });

  it("uppercases and strips non-alpha characters", () => {
    const result = validateAndFilterWords(
      [makeWord("AC/DC")],
      { minWords: 1, maxWords: 10, focusCategories: ["General"] }
    );
    expect(result[0].word).toBe("ACDC");
  });

  it("removes words shorter than 3 characters", () => {
    const result = validateAndFilterWords(
      [makeWord("AB"), makeWord("ABC")],
      { minWords: 1, maxWords: 10, focusCategories: ["General"] }
    );
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("ABC");
  });

  it("removes words longer than 12 characters", () => {
    const result = validateAndFilterWords(
      [makeWord("ABCDEFGHIJKLM"), makeWord("HELLO")],
      { minWords: 1, maxWords: 10, focusCategories: ["General"] }
    );
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("HELLO");
  });

  it("removes duplicates (keeps first occurrence)", () => {
    const result = validateAndFilterWords(
      [makeWord("HELLO"), makeWord("HELLO")],
      { minWords: 1, maxWords: 10, focusCategories: ["General"] }
    );
    expect(result).toHaveLength(1);
  });

  it("filters to requested categories", () => {
    const result = validateAndFilterWords(
      [makeWord("HELLO", "Greetings"), makeWord("WORLD", "Places")],
      { minWords: 1, maxWords: 10, focusCategories: ["Greetings"] }
    );
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("HELLO");
  });

  it("caps at maxWords", () => {
    const words = Array.from({ length: 20 }, (_, i) =>
      makeWord("WORD" + String.fromCharCode(65 + i))
    );
    const result = validateAndFilterWords(words, {
      minWords: 1,
      maxWords: 5,
      focusCategories: ["General"],
    });
    expect(result).toHaveLength(5);
  });
});
