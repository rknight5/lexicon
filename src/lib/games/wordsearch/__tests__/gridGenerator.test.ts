import { describe, it, expect } from "vitest";
import { generateGrid, getDirectionDelta, canPlaceWord } from "../gridGenerator";

describe("getDirectionDelta", () => {
  it("returns correct deltas for all 8 directions", () => {
    expect(getDirectionDelta("right")).toEqual({ dr: 0, dc: 1 });
    expect(getDirectionDelta("left")).toEqual({ dr: 0, dc: -1 });
    expect(getDirectionDelta("down")).toEqual({ dr: 1, dc: 0 });
    expect(getDirectionDelta("up")).toEqual({ dr: -1, dc: 0 });
    expect(getDirectionDelta("downRight")).toEqual({ dr: 1, dc: 1 });
    expect(getDirectionDelta("downLeft")).toEqual({ dr: 1, dc: -1 });
    expect(getDirectionDelta("upRight")).toEqual({ dr: -1, dc: 1 });
    expect(getDirectionDelta("upLeft")).toEqual({ dr: -1, dc: -1 });
  });
});

describe("canPlaceWord", () => {
  it("allows placement in an empty grid", () => {
    const grid = Array.from({ length: 10 }, () => Array(10).fill(""));
    expect(canPlaceWord(grid, "HELLO", 0, 0, "right")).toBe(true);
  });

  it("rejects placement that goes out of bounds", () => {
    const grid = Array.from({ length: 10 }, () => Array(10).fill(""));
    expect(canPlaceWord(grid, "HELLO", 0, 8, "right")).toBe(false);
  });

  it("allows placement that overlaps with matching letters", () => {
    const grid = Array.from({ length: 10 }, () => Array(10).fill(""));
    grid[0][2] = "L"; // Matches 3rd letter of HELLO
    expect(canPlaceWord(grid, "HELLO", 0, 0, "right")).toBe(true);
  });

  it("rejects placement that conflicts with existing letters", () => {
    const grid = Array.from({ length: 10 }, () => Array(10).fill(""));
    grid[0][2] = "X"; // Conflicts with 3rd letter of HELLO
    expect(canPlaceWord(grid, "HELLO", 0, 0, "right")).toBe(false);
  });
});

describe("generateGrid", () => {
  it("returns a grid of the correct size", () => {
    const result = generateGrid(["HELLO", "WORLD"], 10, ["right", "down"]);
    expect(result.grid.length).toBe(10);
    expect(result.grid[0].length).toBe(10);
  });

  it("places all provided words when possible", () => {
    const words = ["CAT", "DOG"];
    const result = generateGrid(words, 10, ["right", "down"]);
    expect(result.placedWords.length).toBe(2);
    expect(result.placedWords.map(w => w.word).sort()).toEqual(["CAT", "DOG"]);
  });

  it("fills all cells with uppercase letters (no empty cells)", () => {
    const result = generateGrid(["HI"], 5, ["right"]);
    for (const row of result.grid) {
      for (const cell of row) {
        expect(cell).toMatch(/^[A-Z]$/);
      }
    }
  });

  it("places words that can be read from the grid", () => {
    const result = generateGrid(["HELLO"], 10, ["right", "down"]);
    const placed = result.placedWords[0];
    const { dr, dc } = getDirectionDelta(placed.direction);
    let word = "";
    for (let i = 0; i < placed.word.length; i++) {
      word += result.grid[placed.startRow + i * dr][placed.startCol + i * dc];
    }
    expect(word).toBe("HELLO");
  });

  it("sorts words longest-first for placement priority", () => {
    const words = ["AB", "ABCDEF", "ABC"];
    const result = generateGrid(words, 10, ["right", "down"]);
    // All should be placed since grid is big enough
    expect(result.placedWords.length).toBe(3);
  });

  it("uses weighted fill letters when weightedFill is true", () => {
    // Statistical test: with weighted fill, common letters (E, T, A, O, etc.)
    // should appear more than rare letters (Q, Z, X)
    const result = generateGrid([], 15, ["right"], true);
    const allLetters = result.grid.flat().join("");
    const commonCount = (allLetters.match(/[ETAOINSHRDL]/g) || []).length;
    const rareCount = (allLetters.match(/[QZXJK]/g) || []).length;
    expect(commonCount).toBeGreaterThan(rareCount);
  });
});
