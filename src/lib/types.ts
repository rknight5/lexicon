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
  gridCols?: number;
  gridRows?: number;
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
  hintsUsed: number;
  hintedWords: Record<string, Direction>; // word -> direction shown
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
  | { type: "USE_HINT"; word: string }
  | { type: "TICK_TIMER" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "START_GAME" }
  | { type: "RESTORE_GAME"; savedState: WordSearchGameState };

// ============================================
// Crossword specific types
// ============================================

export type GameType = "wordsearch" | "crossword" | "anagram";

export interface CrosswordCell {
  letter: string | null; // null = black square
  number?: number; // clue number if word starts here
  acrossClueNum?: number; // which across clue this cell belongs to
  downClueNum?: number; // which down clue this cell belongs to
}

export interface CrosswordClue {
  number: number;
  direction: "across" | "down";
  clue: string;
  answer: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface CrosswordPuzzleData {
  title: string;
  grid: CrosswordCell[][];
  clues: CrosswordClue[];
  gridSize: number;
  funFact: string;
  difficulty: Difficulty;
}

export interface CrosswordGameState {
  puzzle: CrosswordPuzzleData;
  cellValues: (string | null)[][]; // player's current input
  hintedCells: Set<string>; // "row,col" keys for cells revealed by hints
  cursorRow: number;
  cursorCol: number;
  cursorDirection: "across" | "down";
  solvedClues: number[]; // clue numbers that are correct
  livesRemaining: number;
  hintsUsed: number;
  elapsedSeconds: number;
  timerRunning: boolean;
  gameStatus: "idle" | "playing" | "paused" | "won" | "lost";
}

export type CrosswordAction =
  | { type: "SELECT_CELL"; row: number; col: number }
  | { type: "TOGGLE_DIRECTION" }
  | { type: "TYPE_LETTER"; letter: string }
  | { type: "DELETE_LETTER" }
  | { type: "CHECK_WORD" }
  | { type: "HINT" }
  | { type: "TICK_TIMER" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "START_GAME" }
  | { type: "RESTORE_GAME"; savedState: CrosswordGameState };

// ============================================
// Anagram specific types
// ============================================

export interface AnagramWord {
  word: string;
  clue: string;
  category: string;
  difficulty: 1 | 2 | 3;
  scrambled: string;
}

export interface AnagramPuzzleData {
  title: string;
  words: AnagramWord[];
  funFact: string;
  difficulty: Difficulty;
}

export interface AnagramGameState {
  puzzle: AnagramPuzzleData;
  currentWordIndex: number;
  solvedWords: string[];
  selectedIndices: number[];
  livesRemaining: number;
  hintsUsed: number;
  revealedPositions: Record<number, number[]>;
  elapsedSeconds: number;
  timerRunning: boolean;
  gameStatus: "idle" | "playing" | "paused" | "won" | "lost";
}

export type AnagramAction =
  | { type: "START_GAME" }
  | { type: "SELECT_LETTER"; index: number }
  | { type: "DESELECT_LETTER"; index: number }
  | { type: "SUBMIT_WORD" }
  | { type: "SKIP_WORD" }
  | { type: "USE_HINT" }
  | { type: "TICK_TIMER" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "RESTORE_GAME"; savedState: AnagramGameState };

// ============================================
// Storage types
// ============================================

export interface PuzzleResult {
  id: string;
  timestamp: number;
  topic: string;
  gameType: GameType;
  difficulty: Difficulty;
  score: number;
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  livesRemaining: number;
  hintsUsed: number;
  outcome: "won" | "lost";
}

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
    gridCols: 10,
    gridRows: 12,
    minWords: 9,
    maxWords: 9,
    directions: ["right", "down"] as Direction[],
    label: "Easy",
    description: "10×12 grid, 9 words, horizontal & vertical only",
    weightedFill: true,
  },
  medium: {
    gridSize: 13,
    gridCols: 10,
    gridRows: 13,
    minWords: 12,
    maxWords: 12,
    directions: [
      "right", "left", "down", "up",
      "downRight", "downLeft", "upRight", "upLeft",
    ] as Direction[],
    label: "Medium",
    description: "10×13 grid, 12 words, all 8 directions",
    weightedFill: true,
  },
  hard: {
    gridSize: 15,
    gridCols: 12,
    gridRows: 15,
    minWords: 15,
    maxWords: 15,
    directions: [
      "right", "left", "down", "up",
      "downRight", "downLeft", "upRight", "upLeft",
    ] as Direction[],
    label: "Hard",
    description: "12×15 grid, 15 words, all 8 directions, includes obscure terms",
    weightedFill: false,
  },
} as const;

export const CROSSWORD_DIFFICULTY_CONFIG = {
  easy: {
    gridSize: 9,
    minWords: 6,
    maxWords: 10,
    candidateWords: 25,
    lives: 3,
    label: "Easy",
    description: "9×9 grid, 6 clues, straightforward clues",
  },
  medium: {
    gridSize: 11,
    minWords: 10,
    maxWords: 16,
    candidateWords: 30,
    lives: 3,
    label: "Medium",
    description: "11×11 grid, 10 clues, moderate clues",
  },
  hard: {
    gridSize: 13,
    minWords: 12,
    maxWords: 18,
    candidateWords: 35,
    lives: 3,
    label: "Hard",
    description: "13×13 grid, 12 clues, obscure and indirect clues",
  },
} as const;

export const ANAGRAM_DIFFICULTY_CONFIG = {
  easy: {
    minWords: 5,
    maxWords: 7,
    minWordLength: 4,
    maxWordLength: 6,
    showClues: true,
    lives: 3,
    label: "Easy",
    description: "5 short words, clues always shown",
  },
  medium: {
    minWords: 7,
    maxWords: 9,
    minWordLength: 5,
    maxWordLength: 8,
    showClues: true,
    lives: 3,
    label: "Medium",
    description: "7 words, vague clues",
  },
  hard: {
    minWords: 10,
    maxWords: 12,
    minWordLength: 6,
    maxWordLength: 10,
    showClues: false,
    lives: 3,
    label: "Hard",
    description: "10 long words, no clues",
  },
} as const;
