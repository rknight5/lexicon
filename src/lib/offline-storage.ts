import { get, set, del, keys } from "idb-keyval";
import type { GameType, Difficulty, PuzzleData, CrosswordPuzzleData, AnagramPuzzleData } from "./types";

export interface OfflinePuzzle {
  id: string;
  gameType: GameType;
  title: string;
  difficulty: Difficulty;
  puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData;
  savedAt: string;
}

const PREFIX = "puzzle:";

export async function saveOfflinePuzzle(puzzle: OfflinePuzzle): Promise<void> {
  await set(`${PREFIX}${puzzle.id}`, puzzle);
}

export async function getOfflinePuzzle(id: string): Promise<OfflinePuzzle | undefined> {
  return get(`${PREFIX}${id}`);
}

export async function deleteOfflinePuzzle(id: string): Promise<void> {
  await del(`${PREFIX}${id}`);
}

export async function getAllOfflinePuzzles(): Promise<OfflinePuzzle[]> {
  const allKeys = await keys();
  const puzzleKeys = allKeys.filter((k) => typeof k === "string" && k.startsWith(PREFIX));
  const puzzles: OfflinePuzzle[] = [];
  for (const key of puzzleKeys) {
    const puzzle = await get(key);
    if (puzzle) puzzles.push(puzzle as OfflinePuzzle);
  }
  puzzles.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  return puzzles;
}
