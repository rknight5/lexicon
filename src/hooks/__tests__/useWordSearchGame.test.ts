import { describe, it, expect } from "vitest";
import { wordSearchReducer, createInitialState } from "../useWordSearchGame";
import type { PuzzleData } from "@/lib/types";

const mockPuzzle: PuzzleData = {
  title: "Test Puzzle",
  grid: [
    ["H", "E", "L", "L", "O"],
    ["W", "O", "R", "L", "D"],
    ["A", "B", "C", "D", "E"],
    ["F", "G", "H", "I", "J"],
    ["K", "L", "M", "N", "O"],
  ],
  words: [
    {
      word: "HELLO",
      clue: "A greeting",
      category: "Basics",
      difficulty: 1,
      startRow: 0,
      startCol: 0,
      direction: "right",
    },
    {
      word: "WORLD",
      clue: "The planet",
      category: "Basics",
      difficulty: 1,
      startRow: 1,
      startCol: 0,
      direction: "right",
    },
  ],
  gridSize: 5,
  funFact: "Fun fact",
  difficulty: "easy",
};

describe("createInitialState", () => {
  it("creates state with 3 lives and idle status", () => {
    const state = createInitialState(mockPuzzle);
    expect(state.livesRemaining).toBe(3);
    expect(state.gameStatus).toBe("idle");
    expect(state.foundWords).toEqual([]);
    expect(state.elapsedSeconds).toBe(0);
  });
});

describe("wordSearchReducer", () => {
  it("START_GAME sets status to playing", () => {
    const state = createInitialState(mockPuzzle);
    const next = wordSearchReducer(state, { type: "START_GAME" });
    expect(next.gameStatus).toBe("playing");
    expect(next.timerRunning).toBe(true);
  });

  it("START_SELECTION begins cell selection", () => {
    let state = createInitialState(mockPuzzle);
    state = wordSearchReducer(state, { type: "START_GAME" });
    state = wordSearchReducer(state, {
      type: "START_SELECTION",
      cell: { row: 0, col: 0 },
    });
    expect(state.selectedCells).toEqual([{ row: 0, col: 0 }]);
  });

  it("COMPLETE_SELECTION finds a valid word", () => {
    let state = createInitialState(mockPuzzle);
    state = wordSearchReducer(state, { type: "START_GAME" });
    // Select H-E-L-L-O (row 0, cols 0-4)
    state = wordSearchReducer(state, {
      type: "START_SELECTION",
      cell: { row: 0, col: 0 },
    });
    for (let col = 1; col <= 4; col++) {
      state = wordSearchReducer(state, {
        type: "EXTEND_SELECTION",
        cell: { row: 0, col },
      });
    }
    state = wordSearchReducer(state, { type: "COMPLETE_SELECTION" });
    expect(state.foundWords).toContain("HELLO");
    expect(state.selectedCells).toEqual([]);
    expect(state.livesRemaining).toBe(3); // no life lost
  });

  it("COMPLETE_SELECTION loses a life on invalid word", () => {
    let state = createInitialState(mockPuzzle);
    state = wordSearchReducer(state, { type: "START_GAME" });
    // Select H-W (not a word)
    state = wordSearchReducer(state, {
      type: "START_SELECTION",
      cell: { row: 0, col: 0 },
    });
    state = wordSearchReducer(state, {
      type: "EXTEND_SELECTION",
      cell: { row: 1, col: 0 },
    });
    state = wordSearchReducer(state, { type: "COMPLETE_SELECTION" });
    expect(state.livesRemaining).toBe(2);
    expect(state.foundWords).toEqual([]);
  });

  it("sets gameStatus to lost when all lives are gone", () => {
    let state = createInitialState(mockPuzzle);
    state = wordSearchReducer(state, { type: "START_GAME" });
    // Lose 3 lives with invalid selections
    for (let life = 0; life < 3; life++) {
      state = wordSearchReducer(state, {
        type: "START_SELECTION",
        cell: { row: 2, col: 0 },
      });
      state = wordSearchReducer(state, {
        type: "EXTEND_SELECTION",
        cell: { row: 2, col: 1 },
      });
      state = wordSearchReducer(state, { type: "COMPLETE_SELECTION" });
    }
    expect(state.livesRemaining).toBe(0);
    expect(state.gameStatus).toBe("lost");
  });

  it("sets gameStatus to won when all words found", () => {
    let state = createInitialState(mockPuzzle);
    state = wordSearchReducer(state, { type: "START_GAME" });
    // Find HELLO
    state = wordSearchReducer(state, {
      type: "START_SELECTION",
      cell: { row: 0, col: 0 },
    });
    for (let col = 1; col <= 4; col++) {
      state = wordSearchReducer(state, {
        type: "EXTEND_SELECTION",
        cell: { row: 0, col },
      });
    }
    state = wordSearchReducer(state, { type: "COMPLETE_SELECTION" });
    // Find WORLD
    state = wordSearchReducer(state, {
      type: "START_SELECTION",
      cell: { row: 1, col: 0 },
    });
    for (let col = 1; col <= 4; col++) {
      state = wordSearchReducer(state, {
        type: "EXTEND_SELECTION",
        cell: { row: 1, col },
      });
    }
    state = wordSearchReducer(state, { type: "COMPLETE_SELECTION" });
    expect(state.gameStatus).toBe("won");
  });

  it("COMPLETE_SELECTION on single cell does not lose a life", () => {
    let state = createInitialState(mockPuzzle);
    state = wordSearchReducer(state, { type: "START_GAME" });
    state = wordSearchReducer(state, {
      type: "START_SELECTION",
      cell: { row: 0, col: 0 },
    });
    state = wordSearchReducer(state, { type: "COMPLETE_SELECTION" });
    expect(state.livesRemaining).toBe(3);
  });

  it("PAUSE and RESUME control timer", () => {
    let state = createInitialState(mockPuzzle);
    state = wordSearchReducer(state, { type: "START_GAME" });
    expect(state.timerRunning).toBe(true);
    state = wordSearchReducer(state, { type: "PAUSE" });
    expect(state.gameStatus).toBe("paused");
    expect(state.timerRunning).toBe(false);
    state = wordSearchReducer(state, { type: "RESUME" });
    expect(state.gameStatus).toBe("playing");
    expect(state.timerRunning).toBe(true);
  });

  it("TICK_TIMER increments elapsed seconds", () => {
    let state = createInitialState(mockPuzzle);
    state = wordSearchReducer(state, { type: "START_GAME" });
    state = wordSearchReducer(state, { type: "TICK_TIMER" });
    expect(state.elapsedSeconds).toBe(1);
  });

  it("matches words selected in reverse direction", () => {
    let state = createInitialState(mockPuzzle);
    state = wordSearchReducer(state, { type: "START_GAME" });
    // Select O-L-L-E-H (HELLO backwards)
    state = wordSearchReducer(state, {
      type: "START_SELECTION",
      cell: { row: 0, col: 4 },
    });
    for (let col = 3; col >= 0; col--) {
      state = wordSearchReducer(state, {
        type: "EXTEND_SELECTION",
        cell: { row: 0, col },
      });
    }
    state = wordSearchReducer(state, { type: "COMPLETE_SELECTION" });
    expect(state.foundWords).toContain("HELLO");
  });
});
