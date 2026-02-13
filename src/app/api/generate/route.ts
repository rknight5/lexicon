import { NextRequest, NextResponse } from "next/server";
import { suggestCategories, generatePuzzleWords, generateCrosswordWords, generateAnagramWords } from "@/lib/claude";
import { generateGrid } from "@/lib/games/wordsearch/gridGenerator";
import { generateCrosswordGrid } from "@/lib/games/crossword/gridGenerator";
import { DIFFICULTY_CONFIG, CROSSWORD_DIFFICULTY_CONFIG, ANAGRAM_DIFFICULTY_CONFIG } from "@/lib/types";
import type { Difficulty, GameType, PlacedWord, PuzzleData, CrosswordPuzzleData, AnagramPuzzleData } from "@/lib/types";

function scrambleWord(word: string): string {
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

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {

    // Route 1: Category suggestion (topic only, no difficulty)
    if (body.topic && !body.difficulty) {
      const categories = await suggestCategories(body.topic as string);
      return NextResponse.json({ categories });
    }

    // Route 2: Full puzzle generation
    const { topic, difficulty, focusCategories, gameType = "wordsearch" } = body as {
      topic: string;
      difficulty: Difficulty;
      focusCategories: string[];
      gameType?: GameType;
    };

    if (!topic || !difficulty || !focusCategories?.length) {
      return NextResponse.json(
        { error: "Missing required fields: topic, difficulty, focusCategories" },
        { status: 400 }
      );
    }

    if (topic.length > 200) {
      return NextResponse.json(
        { error: "Topic must be 200 characters or less" },
        { status: 400 }
      );
    }

    // ---- Crossword generation ----
    if (gameType === "crossword") {
      const config = CROSSWORD_DIFFICULTY_CONFIG[difficulty];
      if (!config) {
        return NextResponse.json(
          { error: "Invalid difficulty. Must be: easy, medium, or hard" },
          { status: 400 }
        );
      }

      const { title, words, funFact } = await generateCrosswordWords(
        topic,
        difficulty,
        focusCategories
      );

      const { grid, clues } = generateCrosswordGrid(
        words,
        config.gridSize,
        config.minWords
      );

      const puzzle: CrosswordPuzzleData = {
        title,
        grid,
        clues,
        gridSize: config.gridSize,
        funFact,
        difficulty,
      };

      return NextResponse.json(puzzle);
    }

    // ---- Anagram generation ----
    if (gameType === "anagram") {
      const config = ANAGRAM_DIFFICULTY_CONFIG[difficulty];
      if (!config) {
        return NextResponse.json(
          { error: "Invalid difficulty. Must be: easy, medium, or hard" },
          { status: 400 }
        );
      }

      const { title, words, funFact } = await generateAnagramWords(
        topic,
        difficulty,
        focusCategories
      );

      // Scramble each word
      const anagramWords = words.map((w) => ({
        ...w,
        word: w.word.toUpperCase(),
        scrambled: scrambleWord(w.word.toUpperCase()),
      }));

      const puzzle: AnagramPuzzleData = {
        title,
        words: anagramWords,
        funFact,
        difficulty,
      };

      return NextResponse.json(puzzle);
    }

    // ---- Word search generation ----
    const config = DIFFICULTY_CONFIG[difficulty];
    if (!config) {
      return NextResponse.json(
        { error: "Invalid difficulty. Must be: easy, medium, or hard" },
        { status: 400 }
      );
    }

    const { title, words, funFact } = await generatePuzzleWords(
      topic,
      difficulty,
      focusCategories
    );

    const { grid, placedWords } = generateGrid(
      words.map((w) => w.word),
      config.gridSize,
      [...config.directions],
      config.weightedFill
    );

    const mergedWords: PlacedWord[] = placedWords.map((pw) => {
      const wordEntry = words.find((w) => w.word === pw.word)!;
      return {
        ...wordEntry,
        startRow: pw.startRow,
        startCol: pw.startCol,
        direction: pw.direction,
      };
    });

    const puzzle: PuzzleData = {
      title,
      grid,
      words: mergedWords,
      gridSize: config.gridSize,
      funFact,
      difficulty,
    };

    return NextResponse.json(puzzle);
  } catch (error: unknown) {
    console.error("Generate error:", error);

    if (
      error instanceof Error &&
      "status" in error &&
      (error as { status: number }).status === 429
    ) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to generate puzzle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
