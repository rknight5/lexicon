import type { Direction } from "@/lib/types";

interface PlacementResult {
  word: string;
  startRow: number;
  startCol: number;
  direction: Direction;
}

interface GridResult {
  grid: string[][];
  placedWords: PlacementResult[];
}

const DIRECTION_DELTAS: Record<Direction, { dr: number; dc: number }> = {
  right: { dr: 0, dc: 1 },
  left: { dr: 0, dc: -1 },
  down: { dr: 1, dc: 0 },
  up: { dr: -1, dc: 0 },
  downRight: { dr: 1, dc: 1 },
  downLeft: { dr: 1, dc: -1 },
  upRight: { dr: -1, dc: 1 },
  upLeft: { dr: -1, dc: -1 },
};

// Letter frequency weights (approximate English frequency)
const COMMON_LETTERS = "EEEETTTAAAOOINNSSHHRDDLLCUUMWFGYPBVKJXQZ";
const ALL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function getDirectionDelta(dir: Direction): { dr: number; dc: number } {
  return DIRECTION_DELTAS[dir];
}

export function canPlaceWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: Direction
): boolean {
  const { dr, dc } = DIRECTION_DELTAS[direction];
  const gridSize = grid.length;

  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * dr;
    const col = startCol + i * dc;

    if (row < 0 || row >= gridSize || col < 0 || col >= grid[0].length) {
      return false;
    }

    const existing = grid[row][col];
    if (existing !== "" && existing !== word[i]) {
      return false;
    }
  }

  return true;
}

function placeWord(
  grid: string[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: Direction
): void {
  const { dr, dc } = DIRECTION_DELTAS[direction];
  for (let i = 0; i < word.length; i++) {
    grid[startRow + i * dr][startCol + i * dc] = word[i];
  }
}

function getRandomFillLetter(weighted: boolean): string {
  if (weighted) {
    return COMMON_LETTERS[Math.floor(Math.random() * COMMON_LETTERS.length)];
  }
  return ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateGrid(
  words: string[],
  gridCols: number,
  allowedDirections: Direction[],
  weightedFill: boolean = true,
  gridRows?: number
): GridResult {
  const rows = gridRows ?? gridCols;
  const cols = gridCols;
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array(cols).fill("")
  );
  const placedWords: PlacementResult[] = [];

  // Sort longest first — easier to place longer words first
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  const MAX_PLACEMENT_ATTEMPTS = 100;

  for (const word of sortedWords) {
    let placed = false;

    // Try random positions and directions
    const shuffledDirs = shuffle(allowedDirections);

    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS && !placed; attempt++) {
      const direction = shuffledDirs[attempt % shuffledDirs.length];
      const startRow = Math.floor(Math.random() * rows);
      const startCol = Math.floor(Math.random() * cols);

      if (canPlaceWord(grid, word, startRow, startCol, direction)) {
        placeWord(grid, word, startRow, startCol, direction);
        placedWords.push({ word, startRow, startCol, direction });
        placed = true;
      }
    }

    // If placement fails after MAX_PLACEMENT_ATTEMPTS, skip this word
  }

  // Fill remaining empty cells
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] === "") {
        grid[row][col] = getRandomFillLetter(weightedFill);
      }
    }
  }

  return { grid, placedWords };
}
