import { describe, it, expect } from "vitest";
import { generateCrosswordGrid } from "../gridGenerator";
import type { WordEntry } from "@/lib/types";

const SAMPLE_WORDS: WordEntry[] = [
  { word: "GUITAR", clue: "Six-string instrument", category: "Music", difficulty: 1 },
  { word: "DRUMS", clue: "Percussion instrument", category: "Music", difficulty: 1 },
  { word: "BASS", clue: "Low-frequency instrument", category: "Music", difficulty: 1 },
  { word: "RIFF", clue: "Repeated musical phrase", category: "Music", difficulty: 2 },
  { word: "AMP", clue: "Sound amplifier", category: "Music", difficulty: 1 },
  { word: "SOLO", clue: "Individual performance", category: "Music", difficulty: 1 },
  { word: "TUNE", clue: "A melody", category: "Music", difficulty: 1 },
  { word: "STAGE", clue: "Performance platform", category: "Music", difficulty: 1 },
  { word: "BAND", clue: "Group of musicians", category: "Music", difficulty: 1 },
  { word: "TOUR", clue: "Series of concerts", category: "Music", difficulty: 1 },
  { word: "SONG", clue: "Musical composition", category: "Music", difficulty: 1 },
  { word: "ROCK", clue: "Genre of music", category: "Music", difficulty: 1 },
];

describe("generateCrosswordGrid", () => {
  it("places at least one word", () => {
    const result = generateCrosswordGrid(SAMPLE_WORDS, 7, 4);
    expect(result.placedCount).toBeGreaterThanOrEqual(1);
    expect(result.clues.length).toBeGreaterThanOrEqual(1);
  });

  it("returns a grid of the correct size", () => {
    const result = generateCrosswordGrid(SAMPLE_WORDS, 7, 4);
    expect(result.grid).toHaveLength(7);
    result.grid.forEach((row) => expect(row).toHaveLength(7));
  });

  it("marks black squares as null", () => {
    const result = generateCrosswordGrid(SAMPLE_WORDS, 7, 4);
    let hasNull = false;
    let hasLetter = false;
    for (const row of result.grid) {
      for (const cell of row) {
        if (cell.letter === null) hasNull = true;
        if (cell.letter !== null) hasLetter = true;
      }
    }
    expect(hasLetter).toBe(true);
    // A mini crossword should have at least some black squares
    expect(hasNull).toBe(true);
  });

  it("numbers clue-start cells", () => {
    const result = generateCrosswordGrid(SAMPLE_WORDS, 7, 4);
    const numberedCells = result.grid
      .flat()
      .filter((c) => c.number !== undefined);
    expect(numberedCells.length).toBeGreaterThanOrEqual(1);
  });

  it("generates both across and down clues when possible", () => {
    const result = generateCrosswordGrid(SAMPLE_WORDS, 7, 4);
    const acrossClues = result.clues.filter((c) => c.direction === "across");
    const downClues = result.clues.filter((c) => c.direction === "down");
    // Should have at least one of each direction
    expect(acrossClues.length).toBeGreaterThanOrEqual(1);
    expect(downClues.length).toBeGreaterThanOrEqual(1);
  });

  it("clue answers match letters in the grid", () => {
    const result = generateCrosswordGrid(SAMPLE_WORDS, 7, 4);
    for (const clue of result.clues) {
      const dr = clue.direction === "down" ? 1 : 0;
      const dc = clue.direction === "across" ? 1 : 0;
      let gridWord = "";
      for (let i = 0; i < clue.length; i++) {
        const cell = result.grid[clue.startRow + i * dr][clue.startCol + i * dc];
        gridWord += cell.letter;
      }
      expect(gridWord).toBe(clue.answer);
    }
  });

  it("cells have acrossClueNum or downClueNum set", () => {
    const result = generateCrosswordGrid(SAMPLE_WORDS, 7, 4);
    for (const clue of result.clues) {
      const dr = clue.direction === "down" ? 1 : 0;
      const dc = clue.direction === "across" ? 1 : 0;
      for (let i = 0; i < clue.length; i++) {
        const cell = result.grid[clue.startRow + i * dr][clue.startCol + i * dc];
        if (clue.direction === "across") {
          expect(cell.acrossClueNum).toBe(clue.number);
        } else {
          expect(cell.downClueNum).toBe(clue.number);
        }
      }
    }
  });

  it("throws when no words can be placed", () => {
    const tooLong: WordEntry[] = [
      { word: "ABCDEFGHIJ", clue: "Too long", category: "Test", difficulty: 1 },
    ];
    expect(() => generateCrosswordGrid(tooLong, 5, 1)).toThrow();
  });

  it("works with a 5x5 grid (easy)", () => {
    const shortWords: WordEntry[] = SAMPLE_WORDS.filter((w) => w.word.length <= 5);
    const result = generateCrosswordGrid(shortWords, 5, 3);
    expect(result.grid).toHaveLength(5);
    expect(result.placedCount).toBeGreaterThanOrEqual(1);
  });
});
