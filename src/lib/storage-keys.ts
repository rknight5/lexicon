import type { GameType } from "./types";

export const STORAGE_KEYS = {
  PUZZLE_WORDSEARCH: "lexicon-puzzle",
  PUZZLE_CROSSWORD: "lexicon-puzzle-crossword",
  PUZZLE_ANAGRAM: "lexicon-puzzle-anagram",
  PUZZLE_TRIVIA: "lexicon-puzzle-trivia",
  GAME_STATE: "lexicon-game-state",
  PENDING_AUTOSAVE: "lexicon-pending-autosave",
  UNSEEN_SAVES: "lexicon-unseen-saves",
  SHOW_CONFIG: "lexicon-show-config",
} as const;

/** Map a GameType to its puzzle sessionStorage key */
export function puzzleKeyForGameType(gameType: GameType): string {
  switch (gameType) {
    case "crossword": return STORAGE_KEYS.PUZZLE_CROSSWORD;
    case "anagram": return STORAGE_KEYS.PUZZLE_ANAGRAM;
    case "trivia": return STORAGE_KEYS.PUZZLE_TRIVIA;
    default: return STORAGE_KEYS.PUZZLE_WORDSEARCH;
  }
}
