// ============================================
// Base types (shared across all game types)
// ============================================

export type Difficulty = "easy" | "medium" | "hard";

export interface GameConfig {
  topic: string;
  difficulty: Difficulty;
  focusCategories: string[];
}

export interface CategorySuggestion {
  name: string;
  description: string;
}

export interface CategoryResponse {
  categories: CategorySuggestion[];
}

// ============================================
// Word Search specific types
// ============================================

export type Direction =
  | "right"
  | "left"
  | "down"
  | "up"
  | "downRight"
  | "downLeft"
  | "upRight"
  | "upLeft";

export interface WordEntry {
  word: string;
  clue: string;
  category: string;
  difficulty: 1 | 2 | 3;
}

export interface PlacedWord extends WordEntry {
  startRow: number;
  startCol: number;
  direction: Direction;
}

export interface PuzzleData {
  title: string;
  grid: string[][];
  words: PlacedWord[];
  gridSize: number;
  funFact: string;
  difficulty: Difficulty;
}

export interface CellPosition {
  row: number;
  col: number;
}

// ============================================
// Game state types
// ============================================

export interface WordSearchGameState {
  puzzle: PuzzleData;
  foundWords: string[];
  foundPaths: CellPosition[][];
  selectedCells: CellPosition[];
  selectionDirection: Direction | null;
  livesRemaining: number;
  elapsedSeconds: number;
  timerRunning: boolean;
  gameStatus: "idle" | "playing" | "paused" | "won" | "lost";
}

export type WordSearchAction =
  | { type: "START_SELECTION"; cell: CellPosition }
  | { type: "EXTEND_SELECTION"; cell: CellPosition }
  | { type: "SET_SELECTION"; cells: CellPosition[] }
  | { type: "COMPLETE_SELECTION" }
  | { type: "CANCEL_SELECTION" }
  | { type: "TICK_TIMER" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "START_GAME" };

// ============================================
// API types
// ============================================

export interface GenerateCategoriesRequest {
  topic: string;
}

export interface GeneratePuzzleRequest {
  topic: string;
  difficulty: Difficulty;
  focusCategories: string[];
}

export interface GenerateCategoriesResponse {
  categories: CategorySuggestion[];
}

export interface GeneratePuzzleResponse extends PuzzleData {}

// ============================================
// Difficulty config
// ============================================

export const DIFFICULTY_CONFIG = {
  easy: {
    gridSize: 12,
    minWords: 10,
    maxWords: 12,
    directions: ["right", "down"] as Direction[],
    label: "Easy",
    description: "12×12 grid, 10-12 words, horizontal and vertical only",
    weightedFill: true,
  },
  medium: {
    gridSize: 15,
    minWords: 15,
    maxWords: 18,
    directions: [
      "right", "left", "down", "up",
      "downRight", "downLeft", "upRight", "upLeft",
    ] as Direction[],
    label: "Medium",
    description: "15×15 grid, 15-18 words, all 8 directions",
    weightedFill: true,
  },
  hard: {
    gridSize: 18,
    minWords: 18,
    maxWords: 22,
    directions: [
      "right", "left", "down", "up",
      "downRight", "downLeft", "upRight", "upLeft",
    ] as Direction[],
    label: "Hard",
    description: "18×18 grid, 18-22 words, all 8 directions, includes obscure terms",
    weightedFill: false,
  },
} as const;
