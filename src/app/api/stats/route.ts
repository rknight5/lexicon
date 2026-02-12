import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { db } from "@/lib/db";
import { puzzleResults } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import type { GameType, Difficulty } from "@/lib/types";

export async function GET() {
  try {
    const username = await requireAuth();
    const results = await db
      .select()
      .from(puzzleResults)
      .where(eq(puzzleResults.username, username))
      .orderBy(asc(puzzleResults.timestamp));

    const bestScores: Record<GameType, Record<Difficulty, number>> = {
      wordsearch: { easy: 0, medium: 0, hard: 0 },
      crossword: { easy: 0, medium: 0, hard: 0 },
      anagram: { easy: 0, medium: 0, hard: 0 },
    };

    let currentStreak = 0;
    let bestStreak = 0;
    let totalWins = 0;

    for (const r of results) {
      if (r.outcome === "won") {
        totalWins++;
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        const gt = r.gameType as GameType;
        const diff = r.difficulty as Difficulty;
        if (r.score > bestScores[gt][diff]) {
          bestScores[gt][diff] = r.score;
        }
      } else {
        currentStreak = 0;
      }
    }

    return NextResponse.json({
      totalPuzzles: results.length,
      totalWins,
      currentStreak,
      bestStreak,
      bestScores,
    });
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}
