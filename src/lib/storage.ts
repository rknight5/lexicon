import type { PuzzleResult, GameType, Difficulty } from "./types";

export async function saveResult(result: PuzzleResult): Promise<void> {
  try {
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
      credentials: "include",
    });
  } catch (err) {
    console.error("Failed to save puzzle result:", err);
  }
}

export async function getHistory(): Promise<PuzzleResult[]> {
  try {
    const res = await fetch("/api/history", { credentials: "include" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export interface PlayerStats {
  totalPuzzles: number;
  totalWins: number;
  currentStreak: number;
  bestStreak: number;
  bestScores: Record<GameType, Record<Difficulty, number>>;
}

export async function getStats(): Promise<PlayerStats> {
  const empty: PlayerStats = {
    totalPuzzles: 0,
    totalWins: 0,
    currentStreak: 0,
    bestStreak: 0,
    bestScores: {
      wordsearch: { easy: 0, medium: 0, hard: 0 },
      crossword: { easy: 0, medium: 0, hard: 0 },
    },
  };
  try {
    const res = await fetch("/api/stats", { credentials: "include" });
    if (!res.ok) return empty;
    return await res.json();
  } catch {
    return empty;
  }
}
