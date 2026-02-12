import type { PuzzleResult, PuzzleData, CrosswordPuzzleData, AnagramPuzzleData, GameType, Difficulty } from "./types";

export type SaveError = "session-expired" | "network" | "server";

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
      anagram: { easy: 0, medium: 0, hard: 0 },
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

// --- Saved Puzzles ---

export interface SavedPuzzleSummary {
  id: string;
  gameType: GameType;
  title: string;
  topic: string;
  difficulty: Difficulty;
  createdAt: string;
}

export async function savePuzzle(
  gameType: GameType,
  topic: string,
  difficulty: Difficulty,
  puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData
): Promise<{ id: string | null; error?: SaveError }> {
  try {
    const res = await fetch("/api/puzzles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameType,
        title: puzzleData.title,
        topic,
        difficulty,
        puzzleData,
      }),
      credentials: "include",
    });
    if (res.status === 401) return { id: null, error: "session-expired" };
    if (!res.ok) return { id: null, error: "server" };
    const data = await res.json();
    return { id: data.id };
  } catch {
    return { id: null, error: "network" };
  }
}

export async function getSavedPuzzles(): Promise<SavedPuzzleSummary[]> {
  try {
    const res = await fetch("/api/puzzles", { credentials: "include" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function loadSavedPuzzle(
  id: string
): Promise<{ gameType: GameType; puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData } | null> {
  try {
    const res = await fetch(`/api/puzzles/${id}`, { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    return { gameType: data.gameType, puzzleData: data.puzzleData };
  } catch {
    return null;
  }
}

export async function deleteSavedPuzzle(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/puzzles/${id}`, { method: "DELETE", credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}

// --- Auto-Save ---

export interface AutoSaveSummary {
  gameType: GameType;
  title: string;
  difficulty: Difficulty;
  puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData;
  gameState: Record<string, unknown>;
  updatedAt: string;
}

export async function getAutoSave(): Promise<AutoSaveSummary | null> {
  try {
    const res = await fetch("/api/autosave", { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function upsertAutoSave(
  gameType: GameType,
  title: string,
  difficulty: Difficulty,
  puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData,
  gameState: Record<string, unknown>
): Promise<{ ok: boolean; error?: SaveError }> {
  try {
    const res = await fetch("/api/autosave", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameType, title, difficulty, puzzleData, gameState }),
      credentials: "include",
    });
    if (res.status === 401) return { ok: false, error: "session-expired" };
    return { ok: res.ok, error: res.ok ? undefined : "server" };
  } catch {
    return { ok: false, error: "network" };
  }
}

export async function deleteAutoSave(): Promise<boolean> {
  try {
    const res = await fetch("/api/autosave", { method: "DELETE", credentials: "include" });
    return res.ok;
  } catch {
    return false;
  }
}
