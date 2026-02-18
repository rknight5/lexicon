import { NextRequest, NextResponse } from "next/server";
import { suggestCategories, generatePuzzleWords, generateCrosswordWords, generateAnagramWords, generateTriviaQuestions } from "@/lib/claude";
import { generateGrid } from "@/lib/games/wordsearch/gridGenerator";
import { generateCrosswordGrid } from "@/lib/games/crossword/gridGenerator";
import { DIFFICULTY_CONFIG, CROSSWORD_DIFFICULTY_CONFIG, ANAGRAM_DIFFICULTY_CONFIG, TRIVIA_DIFFICULTY_CONFIG } from "@/lib/types";
import type { Difficulty, GameType, PlacedWord, PuzzleData, CrosswordPuzzleData, AnagramPuzzleData, TriviaPuzzleData } from "@/lib/types";
import { isProfane, filterProfaneItems } from "@/lib/content-filter";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { generationLog, DAILY_GENERATION_LIMIT } from "@/lib/schema";
import { eq, and, gte, sql } from "drizzle-orm";

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

async function getGenerationCount(username: string): Promise<number> {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(generationLog)
    .where(
      and(
        eq(generationLog.username, username),
        gte(generationLog.createdAt, todayUtc)
      )
    );
  return count;
}

async function recordGeneration(username: string, gameType: string) {
  await db.insert(generationLog).values({ username, gameType });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let username: string;
  try {
    username = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {

    // Block profane topics server-side
    if (body.topic && isProfane(body.topic as string)) {
      return NextResponse.json(
        { error: "This topic isn't available. Try something else." },
        { status: 422 }
      );
    }

    // Route 1: Category suggestion (topic only, no difficulty)
    if (body.topic && !body.difficulty) {
      const categories = await suggestCategories(body.topic as string);
      const filtered = filterProfaneItems(categories, (c) => [c.name, c.description]);
      return NextResponse.json({ categories: filtered });
    }

    // Check daily generation limit
    const count = await getGenerationCount(username);
    if (count >= DAILY_GENERATION_LIMIT) {
      return NextResponse.json(
        { error: "Daily limit reached", remaining: 0, limit: DAILY_GENERATION_LIMIT },
        { status: 429 }
      );
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

      for (let contentAttempt = 0; contentAttempt < 3; contentAttempt++) {
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

        const hasProfanity = isProfane(title) || isProfane(funFact) ||
          clues.some((c) => isProfane(c.answer) || isProfane(c.clue));

        if (!hasProfanity) {
          await recordGeneration(username, gameType as string);
          const puzzle: CrosswordPuzzleData = {
            title,
            grid,
            clues,
            gridSize: config.gridSize,
            funFact,
            difficulty,
          };
          return NextResponse.json({ ...puzzle, _meta: { remaining: DAILY_GENERATION_LIMIT - count - 1, limit: DAILY_GENERATION_LIMIT } });
        }
      }

      return NextResponse.json(
        { error: "Couldn't generate a puzzle for this topic. Try a different one." },
        { status: 422 }
      );
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

      for (let contentAttempt = 0; contentAttempt < 3; contentAttempt++) {
        const { title, words, funFact } = await generateAnagramWords(
          topic,
          difficulty,
          focusCategories
        );

        const hasProfanity = isProfane(title) || isProfane(funFact) ||
          words.some((w) => isProfane(w.word) || isProfane(w.clue));

        if (!hasProfanity) {
          await recordGeneration(username, gameType as string);
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
          return NextResponse.json({ ...puzzle, _meta: { remaining: DAILY_GENERATION_LIMIT - count - 1, limit: DAILY_GENERATION_LIMIT } });
        }
      }

      return NextResponse.json(
        { error: "Couldn't generate a puzzle for this topic. Try a different one." },
        { status: 422 }
      );
    }

    // ---- Trivia generation ----
    if (gameType === "trivia") {
      const config = TRIVIA_DIFFICULTY_CONFIG[difficulty];
      if (!config) {
        return NextResponse.json(
          { error: "Invalid difficulty. Must be: easy, medium, or hard" },
          { status: 400 }
        );
      }

      for (let contentAttempt = 0; contentAttempt < 3; contentAttempt++) {
        const { title, questions, funFact } = await generateTriviaQuestions(
          topic,
          difficulty,
          focusCategories
        );

        const hasProfanity = isProfane(title) || isProfane(funFact) ||
          questions.some((q) => isProfane(q.question) || q.options.some((o) => isProfane(o)));

        if (!hasProfanity) {
          await recordGeneration(username, gameType as string);
          const puzzle: TriviaPuzzleData = {
            title,
            questions,
            funFact,
            difficulty,
          };
          return NextResponse.json({ ...puzzle, _meta: { remaining: DAILY_GENERATION_LIMIT - count - 1, limit: DAILY_GENERATION_LIMIT } });
        }
      }

      return NextResponse.json(
        { error: "Couldn't generate a puzzle for this topic. Try a different one." },
        { status: 422 }
      );
    }

    // ---- Word search generation ----
    const config = DIFFICULTY_CONFIG[difficulty];
    if (!config) {
      return NextResponse.json(
        { error: "Invalid difficulty. Must be: easy, medium, or hard" },
        { status: 400 }
      );
    }

    for (let contentAttempt = 0; contentAttempt < 3; contentAttempt++) {
      const { title, words, funFact } = await generatePuzzleWords(
        topic,
        difficulty,
        focusCategories
      );

      const hasProfanity = isProfane(title) || isProfane(funFact) ||
        words.some((w) => isProfane(w.word) || isProfane(w.clue));

      if (!hasProfanity) {
        await recordGeneration(username, gameType as string);
        const { grid, placedWords } = generateGrid(
          words.map((w) => w.word),
          config.gridCols,
          [...config.directions],
          config.weightedFill,
          config.gridRows
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
          gridCols: config.gridCols,
          gridRows: config.gridRows,
          funFact,
          difficulty,
        };
        return NextResponse.json({ ...puzzle, _meta: { remaining: DAILY_GENERATION_LIMIT - count - 1, limit: DAILY_GENERATION_LIMIT } });
      }
    }

    return NextResponse.json(
      { error: "Couldn't generate a puzzle for this topic. Try a different one." },
      { status: 422 }
    );
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

    return NextResponse.json(
      { error: "Failed to generate puzzle. Please try again." },
      { status: 500 }
    );
  }
}
