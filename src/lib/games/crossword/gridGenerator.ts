import type { CrosswordCell, CrosswordClue, WordEntry } from "@/lib/types";

interface PlacedCrosswordWord {
  word: string;
  clue: string;
  category: string;
  difficulty: 1 | 2 | 3;
  direction: "across" | "down";
  startRow: number;
  startCol: number;
}

export interface CrosswordGridResult {
  grid: CrosswordCell[][];
  clues: CrosswordClue[];
  placedCount: number;
}

interface Intersection {
  wordIndex: number;
  wordCharIndex: number;
  placedIndex: number;
  placedCharIndex: number;
  row: number;
  col: number;
  direction: "across" | "down";
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Check if a word can be placed at the given position without conflicts.
 * A cell is valid if it's empty OR contains the same letter (intersection).
 * Adjacent cells (parallel neighbors) must not create unintended words.
 */
function canPlace(
  letterGrid: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: "across" | "down",
  gridSize: number
): boolean {
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;

  // Check bounds
  const endRow = startRow + dr * (word.length - 1);
  const endCol = startCol + dc * (word.length - 1);
  if (endRow >= gridSize || endCol >= gridSize || startRow < 0 || startCol < 0) {
    return false;
  }

  // Check cell before the word start (must be black/out-of-bounds)
  const beforeRow = startRow - dr;
  const beforeCol = startCol - dc;
  if (
    beforeRow >= 0 && beforeRow < gridSize &&
    beforeCol >= 0 && beforeCol < gridSize &&
    letterGrid[beforeRow][beforeCol] !== null
  ) {
    return false;
  }

  // Check cell after the word end (must be black/out-of-bounds)
  const afterRow = endRow + dr;
  const afterCol = endCol + dc;
  if (
    afterRow >= 0 && afterRow < gridSize &&
    afterCol >= 0 && afterCol < gridSize &&
    letterGrid[afterRow][afterCol] !== null
  ) {
    return false;
  }

  let intersections = 0;

  for (let i = 0; i < word.length; i++) {
    const row = startRow + i * dr;
    const col = startCol + i * dc;
    const existing = letterGrid[row][col];

    if (existing !== null) {
      // Must match letter for intersection
      if (existing !== word[i]) return false;
      intersections++;
    } else {
      // Empty cell — check perpendicular neighbors to avoid creating adjacent parallel words
      const perpDr = direction === "across" ? 1 : 0;
      const perpDc = direction === "down" ? 1 : 0;

      const neighbor1Row = row + perpDr;
      const neighbor1Col = col + perpDc;
      const neighbor2Row = row - perpDr;
      const neighbor2Col = col - perpDc;

      if (
        (neighbor1Row >= 0 && neighbor1Row < gridSize &&
         neighbor1Col >= 0 && neighbor1Col < gridSize &&
         letterGrid[neighbor1Row][neighbor1Col] !== null) ||
        (neighbor2Row >= 0 && neighbor2Row < gridSize &&
         neighbor2Col >= 0 && neighbor2Col < gridSize &&
         letterGrid[neighbor2Row][neighbor2Col] !== null)
      ) {
        return false;
      }
    }
  }

  return intersections > 0 || letterGrid.every((row) => row.every((c) => c === null));
}

function placeOnGrid(
  letterGrid: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: "across" | "down"
): void {
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;
  for (let i = 0; i < word.length; i++) {
    letterGrid[startRow + i * dr][startCol + i * dc] = word[i];
  }
}

/**
 * Find all valid placements for a word that intersect with already-placed words.
 */
function findPlacements(
  letterGrid: (string | null)[][],
  word: string,
  gridSize: number
): { row: number; col: number; direction: "across" | "down"; score: number }[] {
  const placements: { row: number; col: number; direction: "across" | "down"; score: number }[] = [];

  for (const direction of ["across", "down"] as const) {
    const dr = direction === "down" ? 1 : 0;
    const dc = direction === "across" ? 1 : 0;

    for (let startRow = 0; startRow < gridSize; startRow++) {
      for (let startCol = 0; startCol < gridSize; startCol++) {
        if (!canPlace(letterGrid, word, startRow, startCol, direction, gridSize)) {
          continue;
        }

        // Score: count intersections + prefer central placement
        let intersections = 0;
        for (let i = 0; i < word.length; i++) {
          const r = startRow + i * dr;
          const c = startCol + i * dc;
          if (letterGrid[r][c] !== null) intersections++;
        }

        const centerDist =
          Math.abs(startRow + (dr * word.length) / 2 - gridSize / 2) +
          Math.abs(startCol + (dc * word.length) / 2 - gridSize / 2);
        const score = intersections * 10 - centerDist;

        placements.push({ row: startRow, col: startCol, direction, score });
      }
    }
  }

  // Sort by score descending
  placements.sort((a, b) => b.score - a.score);
  return placements;
}

/**
 * Number the grid cells for clue references.
 * A cell gets a number if it starts an across or down word.
 */
function numberGrid(
  grid: CrosswordCell[][],
  placed: PlacedCrosswordWord[]
): CrosswordClue[] {
  // Collect all word-start positions
  const starts = new Map<string, { across?: PlacedCrosswordWord; down?: PlacedCrosswordWord }>();

  for (const w of placed) {
    const key = `${w.startRow},${w.startCol}`;
    const entry = starts.get(key) ?? {};
    entry[w.direction] = w;
    starts.set(key, entry);
  }

  // Sort by row-major order (top-to-bottom, left-to-right)
  const sortedKeys = [...starts.keys()].sort((a, b) => {
    const [ar, ac] = a.split(",").map(Number);
    const [br, bc] = b.split(",").map(Number);
    return ar !== br ? ar - br : ac - bc;
  });

  const clues: CrosswordClue[] = [];
  let clueNum = 1;

  for (const key of sortedKeys) {
    const [row, col] = key.split(",").map(Number);
    const entry = starts.get(key)!;

    grid[row][col].number = clueNum;

    if (entry.across) {
      const w = entry.across;
      clues.push({
        number: clueNum,
        direction: "across",
        clue: w.clue,
        answer: w.word,
        startRow: w.startRow,
        startCol: w.startCol,
        length: w.word.length,
      });
    }

    if (entry.down) {
      const w = entry.down;
      clues.push({
        number: clueNum,
        direction: "down",
        clue: w.clue,
        answer: w.word,
        startRow: w.startRow,
        startCol: w.startCol,
        length: w.word.length,
      });
    }

    clueNum++;
  }

  // Tag each cell with which across/down clue it belongs to
  for (const clue of clues) {
    const dr = clue.direction === "down" ? 1 : 0;
    const dc = clue.direction === "across" ? 1 : 0;
    for (let i = 0; i < clue.length; i++) {
      const r = clue.startRow + i * dr;
      const c = clue.startCol + i * dc;
      if (clue.direction === "across") {
        grid[r][c].acrossClueNum = clue.number;
      } else {
        grid[r][c].downClueNum = clue.number;
      }
    }
  }

  return clues;
}

/**
 * Generate a crossword grid from candidate words.
 * Attempts multiple times with shuffled word order.
 */
export function generateCrosswordGrid(
  words: WordEntry[],
  gridSize: number,
  minWords: number
): CrosswordGridResult {
  const MAX_ATTEMPTS = 5;
  let bestResult: { placed: PlacedCrosswordWord[]; letterGrid: (string | null)[][] } | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidates = shuffle(words)
      .filter((w) => w.word.length <= gridSize)
      .sort((a, b) => b.word.length - a.word.length);

    if (candidates.length === 0) continue;

    const letterGrid: (string | null)[][] = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(null)
    );
    const placed: PlacedCrosswordWord[] = [];

    // Place first word horizontally through center
    const first = candidates[0];
    const firstRow = Math.floor(gridSize / 2);
    const firstCol = Math.max(0, Math.floor((gridSize - first.word.length) / 2));

    placeOnGrid(letterGrid, first.word, firstRow, firstCol, "across");
    placed.push({
      word: first.word,
      clue: first.clue,
      category: first.category,
      difficulty: first.difficulty,
      direction: "across",
      startRow: firstRow,
      startCol: firstCol,
    });

    // Try to place remaining words
    for (let i = 1; i < candidates.length; i++) {
      const w = candidates[i];
      const placements = findPlacements(letterGrid, w.word, gridSize);
      if (placements.length > 0) {
        const best = placements[0];
        placeOnGrid(letterGrid, w.word, best.row, best.col, best.direction);
        placed.push({
          word: w.word,
          clue: w.clue,
          category: w.category,
          difficulty: w.difficulty,
          direction: best.direction,
          startRow: best.row,
          startCol: best.col,
        });
      }
    }

    if (!bestResult || placed.length > bestResult.placed.length) {
      bestResult = { placed, letterGrid };
    }

    if (placed.length >= minWords) break;
  }

  if (!bestResult || bestResult.placed.length === 0) {
    throw new Error("Could not place any words in crossword grid");
  }

  // Build CrosswordCell grid
  const grid: CrosswordCell[][] = bestResult.letterGrid.map((row) =>
    row.map((letter) => ({ letter }))
  );

  const clues = numberGrid(grid, bestResult.placed);

  return { grid, clues, placedCount: bestResult.placed.length };
}
