import type { PuzzleResult, PuzzleData, CrosswordPuzzleData, AnagramPuzzleData, TriviaPuzzleData, GameType, Difficulty } from "./types";
import { saveOfflinePuzzle, deleteOfflinePuzzle, getAllOfflinePuzzles, getOfflinePuzzle } from "./offline-storage";
import { STORAGE_KEYS } from "./storage-keys";

export type SaveError = "session-expired" | "network" | "server";

export async function saveResult(result: PuzzleResult): Promise<boolean> {
  try {
    const res = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to save puzzle result:", err);
    return false;
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

export async function getStats(): Promise<PlayerStats | null> {
  try {
    const res = await fetch("/api/stats", { credentials: "include" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
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
  puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData | TriviaPuzzleData
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
    // Cache offline
    await saveOfflinePuzzle({
      id: data.id,
      gameType,
      title: puzzleData.title,
      difficulty,
      puzzleData,
      savedAt: new Date().toISOString(),
    }).catch(() => {}); // best-effort
    try { localStorage.setItem(STORAGE_KEYS.UNSEEN_SAVES, "1"); } catch {}
    return { id: data.id };
  } catch {
    return { id: null, error: "network" };
  }
}

export async function getSavedPuzzles(): Promise<SavedPuzzleSummary[]> {
  try {
    const res = await fetch("/api/puzzles", { credentials: "include" });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Network failure — try offline
  }
  // Fall back to IndexedDB
  try {
    const offline = await getAllOfflinePuzzles();
    return offline.map((p) => ({
      id: p.id,
      gameType: p.gameType,
      title: p.title,
      topic: p.title,
      difficulty: p.difficulty,
      createdAt: p.savedAt,
    }));
  } catch {
    return [];
  }
}

export async function loadSavedPuzzle(
  id: string
): Promise<{ gameType: GameType; puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData | TriviaPuzzleData } | null> {
  // Try server first
  try {
    const res = await fetch(`/api/puzzles/${id}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      return { gameType: data.gameType, puzzleData: data.puzzleData };
    }
  } catch {
    // Network failure — try offline
  }
  // Fall back to IndexedDB
  try {
    const offline = await getOfflinePuzzle(id);
    if (offline) {
      return { gameType: offline.gameType, puzzleData: offline.puzzleData };
    }
  } catch {
    // IndexedDB failure
  }
  return null;
}

export async function deleteSavedPuzzle(id: string): Promise<boolean> {
  deleteOfflinePuzzle(id).catch(() => {});
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
  puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData | TriviaPuzzleData;
  gameState: Record<string, unknown>;
  updatedAt: string;
}

export async function getAutoSaves(): Promise<AutoSaveSummary[]> {
  try {
    const res = await fetch("/api/autosave", { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data ? [data] : [];
  } catch {
    return [];
  }
}

export async function upsertAutoSave(
  gameType: GameType,
  title: string,
  difficulty: Difficulty,
  puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData | TriviaPuzzleData,
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

export async function deleteAutoSave(gameType?: string): Promise<boolean> {
  try {
    const res = await fetch("/api/autosave", {
      method: "DELETE",
      headers: gameType ? { "Content-Type": "application/json" } : undefined,
      body: gameType ? JSON.stringify({ gameType }) : undefined,
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}
