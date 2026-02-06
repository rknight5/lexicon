# Lexicon MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a playable word search puzzle generator that takes any topic, generates relevant words via Claude AI, and renders an interactive puzzle with lives, timer, and drag-to-select gameplay.

**Architecture:** Next.js App Router with a single API route (`/api/generate`) that calls Claude Haiku for dynamic category suggestions and Claude Sonnet for word generation + server-side grid construction. Client-side React manages game state via useReducer. No database in MVP — persistence deferred to Phase 2.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS v4, @anthropic-ai/sdk, Lucide React, Vitest + React Testing Library

---

## Task 1: Create GitHub Repo & Initialize Next.js Project

**Files:**
- Create: entire project scaffold

**Step 1: Create GitHub repo**

```bash
gh repo create rknight5/lexicon --public --description "AI-powered word puzzle platform" --clone
```

**Step 2: Initialize Next.js inside the repo**

```bash
cd lexicon
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

If prompted about overwriting, accept (the repo only has a README).

**Step 3: Install dependencies**

```bash
npm install @anthropic-ai/sdk lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

**Step 4: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Create `src/test/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

Add to `package.json` scripts:

```json
"test": "vitest",
"test:run": "vitest run"
```

**Step 5: Create `.env.local`**

```
ANTHROPIC_API_KEY=<key>
```

Add `.env.local` to `.gitignore` (should already be there from Next.js scaffold).

**Step 6: Set up project structure**

Create directories:

```
src/
├── app/
│   ├── api/
│   │   └── generate/
│   ├── puzzle/
│   │   └── wordsearch/
├── components/
│   ├── shared/          # GameBar, PauseMenu, CompletionModal (shared across game types)
│   └── wordsearch/      # PuzzleGrid, WordBank (word-search-specific)
├── lib/
│   ├── games/
│   │   └── wordsearch/  # Grid generator, word-search-specific logic
│   ├── claude.ts         # Claude API client (shared)
│   ├── types.ts          # Shared types
│   └── validation.ts     # Response parsing & validation (shared)
├── hooks/
├── styles/
└── test/
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with dependencies and structure"
git push origin main
```

---

## Task 2: Design System Setup (Tailwind, Fonts, CSS Variables)

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

**Step 1: Configure Tailwind with custom design tokens**

Update `tailwind.config.ts` with the Lexicon color palette, font families, and spacing:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          deep: "#1A0A2E",
          dark: "#2D1B69",
          mid: "#5B2D8E",
          vibrant: "#7B3FBF",
          light: "#9D6CD2",
        },
        gold: {
          primary: "#FFD700",
          dark: "#E5A100",
          light: "#FFF0A0",
        },
        green: {
          accent: "#00E676",
          dark: "#00C853",
        },
        cyan: {
          glow: "#00E5FF",
        },
        pink: {
          accent: "#FF4081",
        },
      },
      fontFamily: {
        display: ["'Bungee'", "cursive"],
        heading: ["'Fredoka One'", "'Nunito'", "sans-serif"],
        body: ["'Nunito'", "'Quicksand'", "sans-serif"],
        grid: ["'Space Mono'", "'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        card: "24px",
        pill: "50px",
        cell: "6px",
      },
      boxShadow: {
        gold: "0 4px 15px rgba(255, 215, 0, 0.4)",
        "gold-hover": "0 6px 20px rgba(255, 215, 0, 0.5)",
        card: "0 8px 32px rgba(0, 0, 0, 0.3)",
        cyan: "0 0 12px rgba(0, 229, 255, 0.6)",
        "green-glow": "0 0 8px rgba(0, 230, 118, 0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
```

**Step 2: Set up global CSS with custom properties and Google Fonts**

Update `src/app/globals.css`:

```css
@import "tailwindcss";

/* CSS custom properties for values Tailwind can't express directly */
:root {
  --overlay-dark: rgba(26, 10, 46, 0.85);
  --white-soft: rgba(255, 255, 255, 0.9);
  --white-muted: rgba(255, 255, 255, 0.6);
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.15);
  --glass-hover: rgba(255, 255, 255, 0.15);
}

body {
  font-family: "Nunito", "Quicksand", sans-serif;
  background: linear-gradient(180deg, #2D1B69 0%, #1A0A2E 100%);
  color: white;
  min-height: 100vh;
}
```

**Step 3: Add Google Fonts to layout**

Update `src/app/layout.tsx` to include Google Fonts link and meta:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lexicon — AI Word Puzzles",
  description: "Turn your interests into word puzzles",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bungee&family=Fredoka+One&family=Nunito:wght@400;600;700;800&family=Space+Mono:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

**Step 4: Verify dev server starts**

```bash
npm run dev
```

Visit `http://localhost:3000` — should see default Next.js page with purple gradient background and Nunito font.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: set up design system with Tailwind tokens, fonts, and CSS variables"
```

---

## Task 3: TypeScript Types & Interfaces

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Define all shared types**

```typescript
// src/lib/types.ts

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
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: define TypeScript types for game state, API, and puzzle data"
```

---

## Task 4: Puzzle Grid Generator Algorithm (TDD)

This is the core algorithm — place words in a grid and fill remaining cells. Pure logic, highly testable.

**Files:**
- Create: `src/lib/games/wordsearch/gridGenerator.ts`
- Create: `src/lib/games/wordsearch/__tests__/gridGenerator.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/games/wordsearch/__tests__/gridGenerator.test.ts

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
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/games/wordsearch/__tests__/gridGenerator.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement the grid generator**

```typescript
// src/lib/games/wordsearch/gridGenerator.ts

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
  gridSize: number,
  allowedDirections: Direction[],
  weightedFill: boolean = true
): GridResult {
  const grid: string[][] = Array.from({ length: gridSize }, () =>
    Array(gridSize).fill("")
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
      const startRow = Math.floor(Math.random() * gridSize);
      const startCol = Math.floor(Math.random() * gridSize);

      if (canPlaceWord(grid, word, startRow, startCol, direction)) {
        placeWord(grid, word, startRow, startCol, direction);
        placedWords.push({ word, startRow, startCol, direction });
        placed = true;
      }
    }

    // If placement fails after MAX_PLACEMENT_ATTEMPTS, skip this word
  }

  // Fill remaining empty cells
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (grid[row][col] === "") {
        grid[row][col] = getRandomFillLetter(weightedFill);
      }
    }
  }

  return { grid, placedWords };
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/games/wordsearch/__tests__/gridGenerator.test.ts
```

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/lib/games/wordsearch/
git commit -m "feat: implement word search grid generator with TDD"
```

---

## Task 5: Claude Response Parser & Word Validator (TDD)

**Files:**
- Create: `src/lib/validation.ts`
- Create: `src/lib/__tests__/validation.test.ts`

**Step 1: Write failing tests**

```typescript
// src/lib/__tests__/validation.test.ts

import { describe, it, expect } from "vitest";
import { parseClaudeResponse, validateAndFilterWords } from "../validation";

describe("parseClaudeResponse", () => {
  it("parses clean JSON", () => {
    const input = JSON.stringify({
      title: "Test Puzzle",
      words: [{ word: "HELLO", clue: "A greeting", category: "Basics", difficulty: 1 }],
      funFact: "Fun fact here",
    });
    const result = parseClaudeResponse(input);
    expect(result.title).toBe("Test Puzzle");
    expect(result.words).toHaveLength(1);
  });

  it("strips markdown code fences", () => {
    const json = JSON.stringify({
      title: "Test",
      words: [{ word: "A", clue: "B", category: "C", difficulty: 1 }],
      funFact: "F",
    });
    const input = "```json\n" + json + "\n```";
    const result = parseClaudeResponse(input);
    expect(result.title).toBe("Test");
  });

  it("handles preamble text before JSON", () => {
    const json = JSON.stringify({
      title: "Test",
      words: [{ word: "A", clue: "B", category: "C", difficulty: 1 }],
      funFact: "F",
    });
    const input = "Here is the puzzle:\n" + json;
    const result = parseClaudeResponse(input);
    expect(result.title).toBe("Test");
  });

  it("throws on missing title", () => {
    const input = JSON.stringify({ words: [], funFact: "F" });
    expect(() => parseClaudeResponse(input)).toThrow("title");
  });

  it("throws on empty words array", () => {
    const input = JSON.stringify({ title: "T", words: [], funFact: "F" });
    expect(() => parseClaudeResponse(input)).toThrow("words");
  });

  it("throws on invalid word entry (missing fields)", () => {
    const input = JSON.stringify({
      title: "T",
      words: [{ word: "A" }],
      funFact: "F",
    });
    expect(() => parseClaudeResponse(input)).toThrow("Invalid word entry");
  });
});

describe("validateAndFilterWords", () => {
  const makeWord = (word: string, category = "General") => ({
    word,
    clue: "test",
    category,
    difficulty: 1 as const,
  });

  it("uppercases and strips non-alpha characters", () => {
    const result = validateAndFilterWords(
      [makeWord("AC/DC")],
      { minWords: 1, maxWords: 10, focusCategories: ["General"] }
    );
    expect(result[0].word).toBe("ACDC");
  });

  it("removes words shorter than 3 characters", () => {
    const result = validateAndFilterWords(
      [makeWord("AB"), makeWord("ABC")],
      { minWords: 1, maxWords: 10, focusCategories: ["General"] }
    );
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("ABC");
  });

  it("removes words longer than 12 characters", () => {
    const result = validateAndFilterWords(
      [makeWord("ABCDEFGHIJKLM"), makeWord("HELLO")],
      { minWords: 1, maxWords: 10, focusCategories: ["General"] }
    );
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("HELLO");
  });

  it("removes duplicates (keeps first occurrence)", () => {
    const result = validateAndFilterWords(
      [makeWord("HELLO"), makeWord("HELLO")],
      { minWords: 1, maxWords: 10, focusCategories: ["General"] }
    );
    expect(result).toHaveLength(1);
  });

  it("filters to requested categories", () => {
    const result = validateAndFilterWords(
      [makeWord("HELLO", "Greetings"), makeWord("WORLD", "Places")],
      { minWords: 1, maxWords: 10, focusCategories: ["Greetings"] }
    );
    expect(result).toHaveLength(1);
    expect(result[0].word).toBe("HELLO");
  });

  it("caps at maxWords", () => {
    const words = Array.from({ length: 20 }, (_, i) =>
      makeWord("WORD" + String.fromCharCode(65 + i))
    );
    const result = validateAndFilterWords(words, {
      minWords: 1,
      maxWords: 5,
      focusCategories: ["General"],
    });
    expect(result).toHaveLength(5);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/__tests__/validation.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement parser and validator**

```typescript
// src/lib/validation.ts

import type { WordEntry } from "./types";

interface PuzzleContent {
  title: string;
  words: WordEntry[];
  funFact: string;
}

export function parseClaudeResponse(rawText: string): PuzzleContent {
  let cleaned = rawText.trim();

  // Strip markdown code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");

  // Find first '{' (skip preamble text)
  const jsonStart = cleaned.indexOf("{");
  if (jsonStart > 0) {
    cleaned = cleaned.slice(jsonStart);
  }

  // Find matching closing brace
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonEnd >= 0) {
    cleaned = cleaned.slice(0, jsonEnd + 1);
  }

  const parsed = JSON.parse(cleaned);

  // Validate shape
  if (!parsed.title || typeof parsed.title !== "string") {
    throw new Error("Missing or invalid 'title' field");
  }
  if (!Array.isArray(parsed.words) || parsed.words.length === 0) {
    throw new Error("Missing or empty 'words' array");
  }
  for (const word of parsed.words) {
    if (!word.word || !word.clue || !word.category || !word.difficulty) {
      throw new Error(`Invalid word entry: ${JSON.stringify(word)}`);
    }
  }

  return parsed as PuzzleContent;
}

export function validateAndFilterWords(
  words: WordEntry[],
  config: { minWords: number; maxWords: number; focusCategories: string[] }
): WordEntry[] {
  return words
    .map((w) => ({
      ...w,
      word: w.word.toUpperCase().replace(/[^A-Z]/g, ""),
    }))
    .filter((w) => w.word.length >= 3 && w.word.length <= 12)
    .filter((w, i, arr) => arr.findIndex((x) => x.word === w.word) === i)
    .filter((w) => config.focusCategories.includes(w.category))
    .slice(0, config.maxWords);
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/__tests__/validation.test.ts
```

Expected: All PASS.

**Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/__tests__/
git commit -m "feat: implement Claude response parser and word validator with TDD"
```

---

## Task 6: Claude API Client & Generate Route

**Files:**
- Create: `src/lib/claude.ts`
- Create: `src/app/api/generate/route.ts`

**Step 1: Implement Claude API client**

```typescript
// src/lib/claude.ts

import Anthropic from "@anthropic-ai/sdk";
import type { CategorySuggestion, Difficulty, WordEntry } from "./types";
import { parseClaudeResponse, validateAndFilterWords } from "./validation";
import { DIFFICULTY_CONFIG } from "./types";

const anthropic = new Anthropic();

// ============================================
// Category suggestion (Haiku — fast + cheap)
// ============================================

export async function suggestCategories(
  topic: string
): Promise<CategorySuggestion[]> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: `You suggest word puzzle categories. Given a topic, return 5-7 relevant categories of words/terms that could appear in a word puzzle about that topic.

Respond with ONLY valid JSON, no markdown fences:
{
  "categories": [
    { "name": "Category Name", "description": "Brief description of what words this includes" }
  ]
}`,
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  let cleaned = text.trim();
  cleaned = cleaned
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "");
  const jsonStart = cleaned.indexOf("{");
  if (jsonStart > 0) cleaned = cleaned.slice(jsonStart);
  const jsonEnd = cleaned.lastIndexOf("}");
  if (jsonEnd >= 0) cleaned = cleaned.slice(0, jsonEnd + 1);

  const parsed = JSON.parse(cleaned);
  return parsed.categories;
}

// ============================================
// Puzzle word generation (Sonnet — quality)
// ============================================

const SYSTEM_PROMPT = `You are a word puzzle content generator. Given a user's topic of interest and their configuration preferences, generate a list of relevant words for a word search puzzle.

Rules:
- Generate the number of words specified in the config
- Each word must be a SINGLE word (no spaces, no hyphens). For multi-word names, use the most recognizable single word (e.g., "Springsteen" not "Bruce Springsteen", "Risotto" not "Mushroom Risotto")
- Words must be 3-12 letters long
- All words must be real, verifiable names, terms, or references
- Only include words from the requested focus categories
- Assign each word a difficulty: 1 (well-known), 2 (moderate), 3 (deep cut)
- Distribute difficulty based on the requested level:
  - Easy: mostly difficulty 1, a few 2s
  - Medium: mix of 1s, 2s, and a few 3s
  - Hard: heavy on 2s and 3s, fewer 1s
- Include a brief, interesting fun fact related to the topic

Respond with ONLY valid JSON in this exact format, with no markdown fences, no preamble, no explanation:
{
  "title": "A catchy title for the puzzle",
  "words": [
    { "word": "EXAMPLE", "clue": "Brief description", "category": "Category Name", "difficulty": 1 }
  ],
  "funFact": "An interesting fact about the topic"
}`;

function buildUserMessage(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[],
  attempt: number
): string {
  const config = DIFFICULTY_CONFIG[difficulty];
  let message = `Topic: ${topic}
Difficulty: ${difficulty}
Word count: ${config.minWords}-${config.maxWords}
Focus categories: ${focusCategories.join(", ")}`;

  if (attempt === 2) {
    message +=
      "\n\nNote: If the topic is narrow, broaden to include related topics, influences, and cultural references.";
  }
  if (attempt === 3) {
    message +=
      "\n\nNote: Generate any words broadly related to this topic area. Ignore category restrictions — just produce enough valid puzzle words.";
  }

  return message;
}

export async function generatePuzzleWords(
  topic: string,
  difficulty: Difficulty,
  focusCategories: string[]
): Promise<{ title: string; words: WordEntry[]; funFact: string }> {
  const config = DIFFICULTY_CONFIG[difficulty];

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage(topic, difficulty, focusCategories, attempt),
        },
      ],
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "Response was truncated. The topic may be too broad — try a more specific topic."
      );
    }

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    try {
      const parsed = parseClaudeResponse(text);
      const categoriesToFilter =
        attempt === 3 ? parsed.words.map((w) => w.category) : focusCategories;
      const validated = validateAndFilterWords(parsed.words, {
        minWords: config.minWords,
        maxWords: config.maxWords,
        focusCategories: categoriesToFilter,
      });

      if (validated.length >= config.minWords) {
        return {
          title: parsed.title,
          words: validated,
          funFact: parsed.funFact,
        };
      }
      // Not enough words — continue to next attempt with broadened prompt
    } catch {
      if (attempt === 3) throw new Error("Failed to parse puzzle data after 3 attempts");
    }
  }

  throw new Error(
    "Couldn't generate enough words for that topic. Try something broader."
  );
}
```

**Step 2: Implement the API route**

```typescript
// src/app/api/generate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { suggestCategories, generatePuzzleWords } from "@/lib/claude";
import { generateGrid } from "@/lib/games/wordsearch/gridGenerator";
import { DIFFICULTY_CONFIG } from "@/lib/types";
import type { Difficulty, PlacedWord, PuzzleData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Route 1: Category suggestion (topic only, no difficulty)
    if (body.topic && !body.difficulty) {
      const categories = await suggestCategories(body.topic);
      return NextResponse.json({ categories });
    }

    // Route 2: Full puzzle generation
    const { topic, difficulty, focusCategories } = body as {
      topic: string;
      difficulty: Difficulty;
      focusCategories: string[];
    };

    if (!topic || !difficulty || !focusCategories?.length) {
      return NextResponse.json(
        { error: "Missing required fields: topic, difficulty, focusCategories" },
        { status: 400 }
      );
    }

    if (topic.length > 200) {
      return NextResponse.json(
        { error: "Topic must be 200 characters or less" },
        { status: 400 }
      );
    }

    const config = DIFFICULTY_CONFIG[difficulty];
    if (!config) {
      return NextResponse.json(
        { error: "Invalid difficulty. Must be: easy, medium, or hard" },
        { status: 400 }
      );
    }

    // Generate words via Claude
    const { title, words, funFact } = await generatePuzzleWords(
      topic,
      difficulty,
      focusCategories
    );

    // Generate the grid
    const { grid, placedWords } = generateGrid(
      words.map((w) => w.word),
      config.gridSize,
      [...config.directions],
      config.weightedFill
    );

    // Merge word metadata with placement data
    const mergedWords: PlacedWord[] = placedWords.map((pw) => {
      const wordEntry = words.find((w) => w.word === pw.word)!;
      return {
        ...wordEntry,
        startRow: pw.startRow,
        startCol: pw.startCol,
        direction: pw.direction,
      };
    });

    const puzzle: PuzzleData = {
      title,
      grid,
      words: mergedWords,
      gridSize: config.gridSize,
      funFact,
      difficulty,
    };

    return NextResponse.json(puzzle);
  } catch (error) {
    console.error("Generate error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate puzzle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 3: Test manually**

Start the dev server and test with curl:

```bash
# Test category suggestion
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "Italian cooking"}'

# Test full puzzle generation
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "80s rock", "difficulty": "medium", "focusCategories": ["Bands", "Songs", "Albums"]}'
```

**Step 4: Commit**

```bash
git add src/lib/claude.ts src/app/api/generate/
git commit -m "feat: implement Claude API client and /api/generate route"
```

---

## Task 7: Game State Reducer

**Files:**
- Create: `src/hooks/useWordSearchGame.ts`
- Create: `src/hooks/__tests__/useWordSearchGame.test.ts`

**Step 1: Write failing tests**

```typescript
// src/hooks/__tests__/useWordSearchGame.test.ts

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
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks/__tests__/useWordSearchGame.test.ts
```

**Step 3: Implement the reducer and hook**

```typescript
// src/hooks/useWordSearchGame.ts

import { useReducer, useEffect, useCallback, useRef } from "react";
import type {
  PuzzleData,
  WordSearchGameState,
  WordSearchAction,
  CellPosition,
} from "@/lib/types";

export function createInitialState(puzzle: PuzzleData): WordSearchGameState {
  return {
    puzzle,
    foundWords: [],
    foundPaths: [],
    selectedCells: [],
    selectionDirection: null,
    livesRemaining: 3,
    elapsedSeconds: 0,
    timerRunning: false,
    gameStatus: "idle",
  };
}

function getSelectedWord(
  grid: string[][],
  cells: CellPosition[]
): string {
  return cells.map((c) => grid[c.row][c.col]).join("");
}

function checkWordMatch(
  selectedWord: string,
  remainingWords: string[]
): string | null {
  // Check forward
  if (remainingWords.includes(selectedWord)) return selectedWord;
  // Check reverse
  const reversed = selectedWord.split("").reverse().join("");
  if (remainingWords.includes(reversed)) return reversed;
  return null;
}

export function wordSearchReducer(
  state: WordSearchGameState,
  action: WordSearchAction
): WordSearchGameState {
  switch (action.type) {
    case "START_GAME":
      return { ...state, gameStatus: "playing", timerRunning: true };

    case "START_SELECTION":
      if (state.gameStatus !== "playing") return state;
      return {
        ...state,
        selectedCells: [action.cell],
        selectionDirection: null,
      };

    case "EXTEND_SELECTION": {
      if (state.gameStatus !== "playing" || state.selectedCells.length === 0)
        return state;
      // Add cell to selection (direction snapping handled by the component)
      return {
        ...state,
        selectedCells: [...state.selectedCells, action.cell],
      };
    }

    case "COMPLETE_SELECTION": {
      if (state.selectedCells.length < 2) {
        // Single cell click — just clear, no penalty
        return { ...state, selectedCells: [], selectionDirection: null };
      }

      const selectedWord = getSelectedWord(
        state.puzzle.grid,
        state.selectedCells
      );
      const remainingWords = state.puzzle.words
        .map((w) => w.word)
        .filter((w) => !state.foundWords.includes(w));
      const matchedWord = checkWordMatch(selectedWord, remainingWords);

      if (matchedWord) {
        const newFoundWords = [...state.foundWords, matchedWord];
        const newFoundPaths = [...state.foundPaths, [...state.selectedCells]];
        const allFound = newFoundWords.length === state.puzzle.words.length;

        return {
          ...state,
          foundWords: newFoundWords,
          foundPaths: newFoundPaths,
          selectedCells: [],
          selectionDirection: null,
          gameStatus: allFound ? "won" : state.gameStatus,
          timerRunning: allFound ? false : state.timerRunning,
        };
      }

      // Invalid word — lose a life
      const newLives = state.livesRemaining - 1;
      return {
        ...state,
        selectedCells: [],
        selectionDirection: null,
        livesRemaining: newLives,
        gameStatus: newLives <= 0 ? "lost" : state.gameStatus,
        timerRunning: newLives <= 0 ? false : state.timerRunning,
      };
    }

    case "CANCEL_SELECTION":
      return { ...state, selectedCells: [], selectionDirection: null };

    case "TICK_TIMER":
      if (!state.timerRunning) return state;
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };

    case "PAUSE":
      if (state.gameStatus !== "playing") return state;
      return { ...state, gameStatus: "paused", timerRunning: false };

    case "RESUME":
      if (state.gameStatus !== "paused") return state;
      return { ...state, gameStatus: "playing", timerRunning: true };

    default:
      return state;
  }
}

export function useWordSearchGame(puzzle: PuzzleData | null) {
  const [state, dispatch] = useReducer(
    wordSearchReducer,
    null,
    () =>
      puzzle
        ? createInitialState(puzzle)
        : createInitialState({
            title: "",
            grid: [],
            words: [],
            gridSize: 0,
            funFact: "",
            difficulty: "medium",
          })
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (state.timerRunning) {
      timerRef.current = setInterval(() => {
        dispatch({ type: "TICK_TIMER" });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.timerRunning]);

  // Pause on tab hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && state.gameStatus === "playing") {
        dispatch({ type: "PAUSE" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.gameStatus]);

  const startGame = useCallback(() => dispatch({ type: "START_GAME" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const startSelection = useCallback(
    (cell: CellPosition) => dispatch({ type: "START_SELECTION", cell }),
    []
  );
  const extendSelection = useCallback(
    (cell: CellPosition) => dispatch({ type: "EXTEND_SELECTION", cell }),
    []
  );
  const completeSelection = useCallback(
    () => dispatch({ type: "COMPLETE_SELECTION" }),
    []
  );
  const cancelSelection = useCallback(
    () => dispatch({ type: "CANCEL_SELECTION" }),
    []
  );

  return {
    state,
    startGame,
    pause,
    resume,
    startSelection,
    extendSelection,
    completeSelection,
    cancelSelection,
  };
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/hooks/__tests__/useWordSearchGame.test.ts
```

**Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: implement word search game state reducer with TDD"
```

---

## Task 8: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Build the landing page**

The landing page has:
- "LEXICON" logo with glow
- Tagline
- Topic text input (glassmorphic)
- "GENERATE PUZZLE" gold CTA button
- Example topic chips (domain-spanning)

```tsx
// src/app/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ConfigScreen } from "@/components/shared/ConfigScreen";

const EXAMPLE_TOPICS = [
  "80s Rock",
  "Italian Cuisine",
  "Marvel Universe",
  "Ancient Egypt",
  "Dog Breeds",
  "Space Exploration",
];

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  const handleSubmit = () => {
    if (!topic.trim()) return;
    setShowConfig(true);
  };

  if (showConfig) {
    return (
      <ConfigScreen
        topic={topic}
        onTopicChange={setTopic}
        onBack={() => setShowConfig(false)}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      {/* Logo */}
      <h1 className="font-display text-5xl md:text-7xl text-gold-primary tracking-wider mb-3"
          style={{ textShadow: "0 0 30px rgba(255, 215, 0, 0.3)" }}>
        LEXICON
      </h1>

      {/* Tagline */}
      <p className="font-heading text-lg md:text-xl mb-10"
         style={{ color: "var(--white-muted)" }}>
        Turn your interests into word puzzles
      </p>

      {/* Topic Input */}
      <div className="w-full max-w-md mb-6">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value.slice(0, 200))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="What are you into? Try '90s grunge' or 'classic jazz piano'"
          className="w-full h-[52px] px-5 rounded-2xl text-base font-body text-white placeholder:text-white/40 outline-none transition-all"
          style={{
            background: "var(--glass-bg)",
            border: "2px solid var(--glass-border)",
          }}
          autoFocus
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleSubmit}
        disabled={!topic.trim()}
        className="flex items-center gap-2 h-12 px-8 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 active:enabled:scale-[0.97]"
        style={{
          background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
          boxShadow: topic.trim()
            ? "0 4px 15px rgba(255, 215, 0, 0.4)"
            : "none",
        }}
      >
        <Sparkles className="w-5 h-5" />
        Generate Puzzle
      </button>

      {/* Example Chips */}
      <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-md">
        {EXAMPLE_TOPICS.map((example) => (
          <button
            key={example}
            onClick={() => {
              setTopic(example);
            }}
            className="px-4 py-2 rounded-pill text-sm font-body font-semibold transition-all hover:border-gold-primary"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "var(--white-muted)",
            }}
          >
            {example}
          </button>
        ))}
      </div>
    </main>
  );
}
```

**Step 2: Verify in browser**

```bash
npm run dev
```

Visit `http://localhost:3000`. Should see the landing page with purple gradient, gold logo, input, button, and chips. The ConfigScreen component doesn't exist yet — that's the next task.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: build landing page with topic input and example chips"
```

---

## Task 9: Config Screen

**Files:**
- Create: `src/components/shared/ConfigScreen.tsx`

**Step 1: Build the config screen**

The config screen:
- Shows topic (editable)
- Disclaimer about niche topics
- Difficulty selection (3 tappable cards)
- Dynamic category chips (fetched from Haiku)
- Generate Puzzle button
- Back link

```tsx
// src/components/shared/ConfigScreen.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Flame, Skull, Sparkles, Tag } from "lucide-react";
import type { Difficulty, CategorySuggestion } from "@/lib/types";

interface ConfigScreenProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  onBack: () => void;
}

const DIFFICULTY_OPTIONS: {
  value: Difficulty;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
    description: "12×12 grid, 10-12 words, horizontal & vertical",
    icon: <Shield className="w-6 h-6" />,
    color: "text-green-accent",
  },
  {
    value: "medium",
    label: "Medium",
    description: "15×15 grid, 15-18 words, all directions",
    icon: <Flame className="w-6 h-6" />,
    color: "text-gold-primary",
  },
  {
    value: "hard",
    label: "Hard",
    description: "18×18 grid, 18-22 words, deep cuts included",
    icon: <Skull className="w-6 h-6" />,
    color: "text-pink-accent",
  },
];

export function ConfigScreen({ topic, onTopicChange, onBack }: ConfigScreenProps) {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      setLoadingCategories(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic }),
        });
        const data = await res.json();
        if (data.categories) {
          setCategories(data.categories);
          setSelectedCategories(data.categories.map((c: CategorySuggestion) => c.name));
        }
      } catch {
        // If category fetch fails, allow generation without categories
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, [topic]);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) return;
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          focusCategories: selectedCategories,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate puzzle");
      }

      const puzzle = await res.json();
      // Store puzzle in sessionStorage and navigate
      sessionStorage.setItem("lexicon-puzzle", JSON.stringify(puzzle));
      router.push("/puzzle/wordsearch");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-5 py-8">
      {/* Back button */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-body text-sm"
          style={{ color: "var(--white-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Topic (editable) */}
        <div>
          <label className="block font-heading text-sm mb-2 text-white/60">
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value.slice(0, 200))}
            className="w-full h-11 px-4 rounded-xl text-base font-body text-white placeholder:text-white/40 outline-none transition-all"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
            }}
          />
          <p className="text-xs mt-2" style={{ color: "var(--white-muted)" }}>
            Tip: If your topic is very niche, we may broaden it to include
            related terms to build a great puzzle.
          </p>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block font-heading text-sm mb-3 text-white/60">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className={`p-4 rounded-2xl text-center transition-all ${
                  difficulty === opt.value
                    ? "scale-[1.02] border-gold-primary"
                    : ""
                }`}
                style={{
                  background:
                    difficulty === opt.value
                      ? "rgba(255, 215, 0, 0.1)"
                      : "var(--glass-bg)",
                  border:
                    difficulty === opt.value
                      ? "2px solid #FFD700"
                      : "1px solid var(--glass-border)",
                }}
              >
                <div
                  className={`${opt.color} flex justify-center mb-2`}
                >
                  {opt.icon}
                </div>
                <div className="font-heading text-sm font-bold">
                  {opt.label}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--white-muted)" }}
                >
                  {opt.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block font-heading text-sm mb-3 text-white/60">
            Focus Areas
          </label>
          {loadingCategories ? (
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 w-24 rounded-pill animate-pulse"
                  style={{ background: "var(--glass-bg)" }}
                />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-body font-semibold transition-all"
                    style={{
                      background: isSelected
                        ? "rgba(255, 215, 0, 0.15)"
                        : "rgba(255, 255, 255, 0.1)",
                      border: isSelected
                        ? "1px solid #FFD700"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                      color: isSelected ? "#FFF0A0" : "var(--white-muted)",
                    }}
                    title={cat.description}
                  >
                    <Tag className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--white-muted)" }}>
              Categories will be auto-selected based on your topic.
            </p>
          )}

          {selectedCategories.length === 0 && categories.length > 0 && (
            <p className="text-sm text-pink-accent mt-2">
              Select at least one category
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-pink-accent bg-pink-accent/10 p-3 rounded-xl">
            {error}
          </p>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={
            generating ||
            selectedCategories.length === 0 ||
            !topic.trim()
          }
          className="w-full flex items-center justify-center gap-2 h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 active:enabled:scale-[0.97]"
          style={{
            background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
            boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
          }}
        >
          {generating ? (
            <span className="animate-pulse">Generating...</span>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Puzzle
            </>
          )}
        </button>
      </div>
    </main>
  );
}
```

**Step 2: Verify in browser**

Enter a topic on the landing page, submit. The config screen should appear with dynamic categories loading.

**Step 3: Commit**

```bash
git add src/components/shared/ConfigScreen.tsx
git commit -m "feat: build config screen with dynamic categories and difficulty selection"
```

---

## Task 10: Puzzle Page Shell & Grid Component

**Files:**
- Create: `src/app/puzzle/wordsearch/page.tsx`
- Create: `src/components/wordsearch/PuzzleGrid.tsx`

**Step 1: Build the puzzle page shell**

```tsx
// src/app/puzzle/wordsearch/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PuzzleGrid } from "@/components/wordsearch/PuzzleGrid";
import { WordBank } from "@/components/wordsearch/WordBank";
import { GameBar } from "@/components/shared/GameBar";
import { PauseMenu } from "@/components/shared/PauseMenu";
import { GameOverModal } from "@/components/shared/GameOverModal";
import { CompletionModal } from "@/components/shared/CompletionModal";
import { useWordSearchGame } from "@/hooks/useWordSearchGame";
import type { PuzzleData } from "@/lib/types";

export default function WordSearchPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lexicon-puzzle");
    if (!stored) {
      router.push("/");
      return;
    }
    setPuzzle(JSON.parse(stored));
  }, [router]);

  if (!puzzle) return null;

  return <WordSearchGame puzzle={puzzle} />;
}

function WordSearchGame({ puzzle }: { puzzle: PuzzleData }) {
  const router = useRouter();
  const {
    state,
    startGame,
    pause,
    resume,
    startSelection,
    extendSelection,
    completeSelection,
    cancelSelection,
  } = useWordSearchGame(puzzle);

  // Start game on first grid interaction (handled in PuzzleGrid)
  const handleFirstInteraction = () => {
    if (state.gameStatus === "idle") {
      startGame();
    }
  };

  const handleNewTopic = () => {
    sessionStorage.removeItem("lexicon-puzzle");
    router.push("/");
  };

  const handlePlayAgain = () => {
    // Same config, re-trigger generation
    // For now, just go back to home
    sessionStorage.removeItem("lexicon-puzzle");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <GameBar
        difficulty={puzzle.difficulty}
        livesRemaining={state.livesRemaining}
        elapsedSeconds={state.elapsedSeconds}
        onPause={pause}
        gameStatus={state.gameStatus}
      />

      <div className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 px-5 py-4 max-w-5xl mx-auto w-full">
        {/* Puzzle title */}
        <div className="w-full lg:hidden text-center mb-2">
          <h2 className="font-heading text-xl font-bold">{puzzle.title}</h2>
        </div>

        <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
          <PuzzleGrid
            grid={puzzle.grid}
            gridSize={puzzle.gridSize}
            selectedCells={state.selectedCells}
            foundPaths={state.foundPaths}
            gameStatus={state.gameStatus}
            onCellPointerDown={(cell) => {
              handleFirstInteraction();
              startSelection(cell);
            }}
            onCellPointerEnter={extendSelection}
            onPointerUp={completeSelection}
            onPointerLeave={cancelSelection}
          />
        </div>

        <div className="w-full lg:w-64 lg:flex-shrink-0">
          <div className="hidden lg:block mb-4">
            <h2 className="font-heading text-xl font-bold">{puzzle.title}</h2>
          </div>
          <WordBank
            words={puzzle.words}
            foundWords={state.foundWords}
          />
        </div>
      </div>

      {/* Modals */}
      {state.gameStatus === "paused" && (
        <PauseMenu onResume={resume} onQuit={handleNewTopic} />
      )}

      {state.gameStatus === "lost" && (
        <GameOverModal
          wordsFound={state.foundWords.length}
          wordsTotal={puzzle.words.length}
          elapsedSeconds={state.elapsedSeconds}
          onTryAgain={handlePlayAgain}
          onNewTopic={handleNewTopic}
        />
      )}

      {state.gameStatus === "won" && (
        <CompletionModal
          wordsFound={state.foundWords.length}
          wordsTotal={puzzle.words.length}
          elapsedSeconds={state.elapsedSeconds}
          livesRemaining={state.livesRemaining}
          funFact={puzzle.funFact}
          onPlayAgain={handlePlayAgain}
          onNewTopic={handleNewTopic}
        />
      )}
    </div>
  );
}
```

**Step 2: Build the PuzzleGrid component**

This is the most complex UI component — handles drag interaction with direction snapping.

```tsx
// src/components/wordsearch/PuzzleGrid.tsx

"use client";

import { useCallback, useRef } from "react";
import type { CellPosition } from "@/lib/types";

interface PuzzleGridProps {
  grid: string[][];
  gridSize: number;
  selectedCells: CellPosition[];
  foundPaths: CellPosition[][];
  gameStatus: string;
  onCellPointerDown: (cell: CellPosition) => void;
  onCellPointerEnter: (cell: CellPosition) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
}

function isCellInList(cells: CellPosition[], row: number, col: number): boolean {
  return cells.some((c) => c.row === row && c.col === col);
}

function isCellFound(foundPaths: CellPosition[][], row: number, col: number): boolean {
  return foundPaths.some((path) => isCellInList(path, row, col));
}

/**
 * Given a start cell and a current pointer cell, snap to the nearest
 * valid 8-direction line and return all cells along that line from
 * start to the projected end point.
 */
export function getSnappedCells(
  start: CellPosition,
  current: CellPosition,
  gridSize: number
): CellPosition[] {
  const dr = current.row - start.row;
  const dc = current.col - start.col;

  if (dr === 0 && dc === 0) return [start];

  // Calculate angle and snap to nearest 45 degrees
  const angle = Math.atan2(dr, dc);
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

  // Get direction deltas (will be -1, 0, or 1)
  const dirR = Math.round(Math.sin(snapped));
  const dirC = Math.round(Math.cos(snapped));

  if (dirR === 0 && dirC === 0) return [start];

  // Calculate how many steps along this direction
  const distance = Math.max(Math.abs(dr), Math.abs(dc));

  const cells: CellPosition[] = [];
  for (let i = 0; i <= distance; i++) {
    const row = start.row + i * dirR;
    const col = start.col + i * dirC;
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) break;
    cells.push({ row, col });
  }

  return cells;
}

export function PuzzleGrid({
  grid,
  gridSize,
  selectedCells,
  foundPaths,
  gameStatus,
  onCellPointerDown,
  onCellPointerEnter,
  onPointerUp,
  onPointerLeave,
}: PuzzleGridProps) {
  const isDragging = useRef(false);
  const startCell = useRef<CellPosition | null>(null);

  const handlePointerDown = useCallback(
    (row: number, col: number) => {
      if (gameStatus !== "playing" && gameStatus !== "idle") return;
      isDragging.current = true;
      startCell.current = { row, col };
      onCellPointerDown({ row, col });
    },
    [gameStatus, onCellPointerDown]
  );

  const handlePointerEnter = useCallback(
    (row: number, col: number) => {
      if (!isDragging.current || !startCell.current) return;

      // Calculate snapped cells from start to current
      const snapped = getSnappedCells(
        startCell.current,
        { row, col },
        gridSize
      );

      // Dispatch the full snapped path by clearing and re-extending
      // The reducer receives the snapped cells
      onCellPointerEnter({ row, col });
    },
    [gridSize, onCellPointerEnter]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    startCell.current = null;
    onPointerUp();
  }, [onPointerUp]);

  const handlePointerLeaveGrid = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      startCell.current = null;
      onPointerLeave();
    }
  }, [onPointerLeave]);

  // Calculate cell size based on viewport
  // Mobile: fit within viewport width minus padding
  const cellSizeClass =
    gridSize <= 12
      ? "w-7 h-7 md:w-9 md:h-9 lg:w-10 lg:h-10"
      : gridSize <= 15
        ? "w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10"
        : "w-5 h-5 md:w-7 md:h-7 lg:w-9 lg:h-9";

  const fontSizeClass =
    gridSize <= 12
      ? "text-sm md:text-base lg:text-lg"
      : gridSize <= 15
        ? "text-xs md:text-sm lg:text-base"
        : "text-[10px] md:text-xs lg:text-sm";

  return (
    <div
      className="inline-grid gap-0.5 p-2 rounded-2xl select-none"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        background: "rgba(0, 0, 0, 0.2)",
        border: "2px solid rgba(255, 255, 255, 0.1)",
        touchAction: "none",
      }}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeaveGrid}
    >
      {grid.map((row, rowIdx) =>
        row.map((letter, colIdx) => {
          const isSelected = isCellInList(selectedCells, rowIdx, colIdx);
          const isFound = isCellFound(foundPaths, rowIdx, colIdx);

          return (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={`
                ${cellSizeClass} ${fontSizeClass}
                flex items-center justify-center
                rounded-cell font-grid font-bold
                cursor-pointer transition-all duration-150
                ${isFound ? "text-green-accent" : "text-white"}
              `}
              style={{
                background: isSelected
                  ? "rgba(0, 229, 255, 0.3)"
                  : isFound
                    ? "rgba(0, 230, 118, 0.25)"
                    : "rgba(255, 255, 255, 0.08)",
                boxShadow: isSelected
                  ? "0 0 8px rgba(0, 229, 255, 0.4)"
                  : "none",
                transform: isSelected ? "scale(1.05)" : "none",
              }}
              onPointerDown={() => handlePointerDown(rowIdx, colIdx)}
              onPointerEnter={() => handlePointerEnter(rowIdx, colIdx)}
            >
              {letter}
            </div>
          );
        })
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/puzzle/ src/components/wordsearch/
git commit -m "feat: build puzzle page and interactive grid component with drag selection"
```

---

## Task 11: Word Bank Component

**Files:**
- Create: `src/components/wordsearch/WordBank.tsx`

**Step 1: Build the word bank**

```tsx
// src/components/wordsearch/WordBank.tsx

import { CheckCircle } from "lucide-react";
import type { PlacedWord } from "@/lib/types";

interface WordBankProps {
  words: PlacedWord[];
  foundWords: string[];
}

export function WordBank({ words, foundWords }: WordBankProps) {
  // Group words by category
  const grouped = words.reduce(
    (acc, word) => {
      if (!acc[word.category]) acc[word.category] = [];
      acc[word.category].push(word);
      return acc;
    },
    {} as Record<string, PlacedWord[]>
  );

  return (
    <div className="space-y-1">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-heading text-sm font-bold text-white/60">
          WORDS
        </span>
        <span className="font-body text-sm text-white/60">
          {foundWords.length} / {words.length}
        </span>
      </div>

      {/* Grouped words */}
      {Object.entries(grouped).map(([category, categoryWords], idx) => (
        <div key={category} className={idx > 0 ? "mt-4" : ""}>
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider mb-2 text-white/40">
            {category}
          </h3>
          <div className="space-y-2">
            {categoryWords.map((word) => {
              const isFound = foundWords.includes(word.word);
              return (
                <div
                  key={word.word}
                  className={`flex items-start gap-2 transition-opacity ${
                    isFound ? "opacity-50" : ""
                  }`}
                >
                  {isFound && (
                    <CheckCircle className="w-4 h-4 text-green-accent flex-shrink-0 mt-0.5" />
                  )}
                  <div className={isFound ? "ml-0" : "ml-6"}>
                    <span
                      className={`font-body text-sm font-semibold uppercase ${
                        isFound ? "line-through text-white/40" : "text-white"
                      }`}
                    >
                      {word.word}
                    </span>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--white-muted)" }}
                    >
                      {word.clue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/wordsearch/WordBank.tsx
git commit -m "feat: build word bank component with category grouping"
```

---

## Task 12: Game Bar Component

**Files:**
- Create: `src/components/shared/GameBar.tsx`

**Step 1: Build the game bar**

```tsx
// src/components/shared/GameBar.tsx

import { Heart, Clock, PauseCircle, Shield, Flame, Skull } from "lucide-react";
import type { Difficulty } from "@/lib/types";

interface GameBarProps {
  difficulty: Difficulty;
  livesRemaining: number;
  elapsedSeconds: number;
  onPause: () => void;
  gameStatus: string;
}

const DIFFICULTY_BADGE: Record<
  Difficulty,
  { label: string; icon: React.ReactNode; className: string }
> = {
  easy: {
    label: "Easy",
    icon: <Shield className="w-4 h-4" />,
    className: "text-green-accent border-green-accent/30 bg-green-accent/10",
  },
  medium: {
    label: "Medium",
    icon: <Flame className="w-4 h-4" />,
    className: "text-gold-primary border-gold-primary/30 bg-gold-primary/10",
  },
  hard: {
    label: "Hard",
    icon: <Skull className="w-4 h-4" />,
    className: "text-pink-accent border-pink-accent/30 bg-pink-accent/10",
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function GameBar({
  difficulty,
  livesRemaining,
  elapsedSeconds,
  onPause,
  gameStatus,
}: GameBarProps) {
  const badge = DIFFICULTY_BADGE[difficulty];

  return (
    <div
      className="h-14 px-4 flex items-center justify-between border-b"
      style={{
        background: "rgba(26, 10, 46, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Left: placeholder for future best score */}
      <div className="w-20">
        <span className="font-body text-xs text-white/40">Best: —</span>
      </div>

      {/* Center: difficulty badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border text-xs font-heading font-bold ${badge.className}`}
      >
        {badge.icon}
        {badge.label}
      </div>

      {/* Right: lives + timer + pause */}
      <div className="flex items-center gap-4">
        {/* Lives */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <Heart
              key={i}
              className={`w-4 h-4 transition-all ${
                i < livesRemaining
                  ? "text-red-400"
                  : "text-gray-600"
              }`}
              fill={i < livesRemaining ? "currentColor" : "none"}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="inline-flex items-center gap-1.5 text-white/60">
          <Clock className="w-4 h-4" />
          <span
            className={`font-grid text-sm ${
              gameStatus === "paused" ? "animate-pulse" : ""
            }`}
          >
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Pause */}
        <button
          onClick={onPause}
          className="text-white/60 hover:text-white transition-colors"
          disabled={gameStatus !== "playing"}
        >
          <PauseCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/shared/GameBar.tsx
git commit -m "feat: build game bar with lives, timer, and difficulty badge"
```

---

## Task 13: Pause Menu, Game Over, and Completion Modals

**Files:**
- Create: `src/components/shared/PauseMenu.tsx`
- Create: `src/components/shared/GameOverModal.tsx`
- Create: `src/components/shared/CompletionModal.tsx`

**Step 1: Build PauseMenu**

```tsx
// src/components/shared/PauseMenu.tsx

"use client";

import { useState } from "react";

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  const [confirmQuit, setConfirmQuit] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "var(--overlay-dark)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-card p-6 space-y-4"
        style={{
          background: "linear-gradient(135deg, #2D1B69 0%, #5B2D8E 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2 className="font-heading text-2xl font-bold text-center">Paused</h2>

        {confirmQuit ? (
          <>
            <p className="text-sm text-center" style={{ color: "var(--white-muted)" }}>
              Are you sure? Your progress will be lost.
            </p>
            <div className="space-y-3">
              <button
                onClick={onQuit}
                className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-white bg-pink-accent/20 border-2 border-pink-accent transition-all hover:-translate-y-0.5"
              >
                Quit
              </button>
              <button
                onClick={() => setConfirmQuit(false)}
                className="w-full h-10 rounded-pill font-body text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onResume}
              className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
                boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
              }}
            >
              Resume
            </button>
            <button
              onClick={() => setConfirmQuit(true)}
              className="w-full h-10 rounded-pill font-body text-sm text-white/60 hover:text-white transition-colors"
            >
              Quit Without Saving
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Build GameOverModal**

```tsx
// src/components/shared/GameOverModal.tsx

interface GameOverModalProps {
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  onTryAgain: () => void;
  onNewTopic: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function GameOverModal({
  wordsFound,
  wordsTotal,
  elapsedSeconds,
  onTryAgain,
  onNewTopic,
}: GameOverModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "var(--overlay-dark)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-card p-6 space-y-4 text-center"
        style={{
          background: "linear-gradient(135deg, #2D1B69 0%, #5B2D8E 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2 className="font-heading text-3xl font-bold text-pink-accent">
          Game Over
        </h2>

        <div className="space-y-2">
          <p className="font-body text-lg">
            <span className="font-bold">{wordsFound}</span>
            <span style={{ color: "var(--white-muted)" }}>
              {" "}/ {wordsTotal} words found
            </span>
          </p>
          <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
            Time: {formatTime(elapsedSeconds)}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={onTryAgain}
            className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
            }}
          >
            Try Again
          </button>
          <button
            onClick={onNewTopic}
            className="w-full h-10 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-green-accent border-2 border-green-accent transition-all hover:-translate-y-0.5"
          >
            New Topic
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Build CompletionModal**

```tsx
// src/components/shared/CompletionModal.tsx

import { Trophy } from "lucide-react";

interface CompletionModalProps {
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  livesRemaining: number;
  funFact: string;
  onPlayAgain: () => void;
  onNewTopic: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CompletionModal({
  wordsFound,
  wordsTotal,
  elapsedSeconds,
  livesRemaining,
  funFact,
  onPlayAgain,
  onNewTopic,
}: CompletionModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "var(--overlay-dark)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-card p-6 space-y-4 text-center"
        style={{
          background: "linear-gradient(135deg, #2D1B69 0%, #5B2D8E 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex justify-center">
          <Trophy className="w-10 h-10 text-gold-primary" />
        </div>

        <h2 className="font-heading text-3xl font-bold text-gold-primary">
          Puzzle Complete!
        </h2>

        <div className="space-y-2">
          <p className="font-body text-lg">
            <span className="font-bold">{wordsFound}</span>
            <span style={{ color: "var(--white-muted)" }}>
              {" "}/ {wordsTotal} words
            </span>
          </p>
          <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
            Time: {formatTime(elapsedSeconds)} · Lives: {livesRemaining}/3
          </p>
          {livesRemaining === 3 && (
            <p className="font-heading text-sm text-gold-primary">
              Perfect Game! +500 bonus
            </p>
          )}
        </div>

        {/* Fun fact */}
        <div
          className="rounded-2xl p-4 text-left"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <p className="font-heading text-xs font-bold uppercase tracking-wider text-gold-primary mb-1">
            Fun Fact
          </p>
          <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
            {funFact}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
            }}
          >
            Play Again
          </button>
          <button
            onClick={onNewTopic}
            className="w-full h-10 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-green-accent border-2 border-green-accent transition-all hover:-translate-y-0.5"
          >
            New Topic
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/components/shared/PauseMenu.tsx src/components/shared/GameOverModal.tsx src/components/shared/CompletionModal.tsx
git commit -m "feat: build pause menu, game over, and completion modals"
```

---

## Task 14: Wire Up Direction Snapping in Grid Interaction

The current PuzzleGrid dispatches raw pointer events, but the reducer needs snapped cell paths. This task integrates the direction snapping logic so dragging feels correct.

**Files:**
- Modify: `src/components/wordsearch/PuzzleGrid.tsx`
- Modify: `src/hooks/useWordSearchGame.ts`

**Step 1: Update the game hook to accept snapped cell arrays**

Add a `SET_SELECTION` action to the reducer that replaces the entire selection:

```typescript
// Add to WordSearchAction type in types.ts:
| { type: "SET_SELECTION"; cells: CellPosition[] }
```

Add the case to the reducer in `useWordSearchGame.ts`:

```typescript
case "SET_SELECTION":
  if (state.gameStatus !== "playing") return state;
  return { ...state, selectedCells: action.cells };
```

Add to the hook's return:

```typescript
const setSelection = useCallback(
  (cells: CellPosition[]) => dispatch({ type: "SET_SELECTION", cells }),
  []
);
```

**Step 2: Update PuzzleGrid to calculate snapped paths on drag**

Instead of dispatching `EXTEND_SELECTION` per cell, PuzzleGrid calculates the full snapped path from start to current pointer position and dispatches `SET_SELECTION` with the complete path.

Update the `handlePointerEnter` in PuzzleGrid to call `getSnappedCells` and pass the full array via a new `onSelectionChange` prop, replacing `onCellPointerEnter`.

**Step 3: Test manually**

Drag on the grid — selection should snap to 8 valid directions and feel smooth.

**Step 4: Commit**

```bash
git add src/components/wordsearch/PuzzleGrid.tsx src/hooks/useWordSearchGame.ts src/lib/types.ts
git commit -m "feat: integrate direction snapping into grid drag interaction"
```

---

## Task 15: Loading State

**Files:**
- Create: `src/components/shared/LoadingOverlay.tsx`
- Modify: `src/components/shared/ConfigScreen.tsx`

**Step 1: Build loading overlay**

```tsx
// src/components/shared/LoadingOverlay.tsx

interface LoadingOverlayProps {
  topic: string;
  difficulty: string;
}

export function LoadingOverlay({ topic, difficulty }: LoadingOverlayProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      {/* Pulsing orb */}
      <div
        className="w-20 h-20 rounded-full mb-8 animate-pulse"
        style={{
          background:
            "radial-gradient(circle, #7B3FBF 0%, #5B2D8E 50%, transparent 70%)",
          boxShadow: "0 0 40px rgba(123, 63, 191, 0.4)",
        }}
      />

      <p className="font-heading text-lg text-white mb-2">
        Building your puzzle...
      </p>
      <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} {topic} word
        search
      </p>
    </div>
  );
}
```

**Step 2: Show loading overlay in ConfigScreen during generation**

In `ConfigScreen.tsx`, when `generating` is true, render `<LoadingOverlay>` instead of the config form.

**Step 3: Commit**

```bash
git add src/components/shared/LoadingOverlay.tsx src/components/shared/ConfigScreen.tsx
git commit -m "feat: add loading overlay during puzzle generation"
```

---

## Task 16: MVP Animations

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/wordsearch/PuzzleGrid.tsx` (shake animation on miss)
- Modify: `src/components/shared/GameBar.tsx` (heart animation on life lost)

**Step 1: Add CSS animations**

Add to `globals.css`:

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

@keyframes flash-green {
  0% { background: rgba(0, 230, 118, 0.6); }
  100% { background: rgba(0, 230, 118, 0.25); }
}

@keyframes heart-break {
  0% { transform: scale(1); }
  50% { transform: scale(0.6); }
  100% { transform: scale(1); }
}

.animate-shake {
  animation: shake 0.3s ease-in-out;
}

.animate-flash-green {
  animation: flash-green 0.5s ease-out;
}

.animate-heart-break {
  animation: heart-break 0.3s ease-in-out;
}
```

**Step 2: Apply animations in components**

- PuzzleGrid: add `animate-shake` class to grid container briefly on invalid selection
- GameBar: add `animate-heart-break` to heart icon when life is lost
- PuzzleGrid: add `animate-flash-green` to cells when a word is found

Track animation triggers via state (e.g., a `lastMissTimestamp` or `lastFoundWord` that triggers CSS class application for 300-500ms).

**Step 3: Commit**

```bash
git add src/app/globals.css src/components/wordsearch/PuzzleGrid.tsx src/components/shared/GameBar.tsx
git commit -m "feat: add shake, flash, and heart-break animations"
```

---

## Task 17: Responsive Layout & Mobile Touch

**Files:**
- Modify: `src/app/puzzle/wordsearch/page.tsx`
- Modify: `src/components/wordsearch/PuzzleGrid.tsx`
- Modify: `src/components/wordsearch/WordBank.tsx`

**Step 1: Ensure mobile layout**

- Puzzle page: grid stacks above word bank on mobile (`flex-col`), side-by-side on desktop (`lg:flex-row`)
- Grid cells use responsive sizes (already handled with `w-5`/`w-6`/`w-7` breakpoints)
- Word bank: collapsible on mobile with a toggle button showing word count

**Step 2: Touch optimization**

- `touch-action: none` on grid (already set)
- Use `onPointerDown`/`onPointerEnter`/`onPointerUp` (already using pointer events)
- Add `onPointerCancel` handling (same as pointer leave)
- Ensure font sizes are ≥16px on inputs to prevent iOS zoom

**Step 3: Test on mobile viewport**

Use Chrome DevTools mobile emulation. Test drag interaction at 375px width.

**Step 4: Commit**

```bash
git add src/app/puzzle/ src/components/
git commit -m "feat: responsive layout and mobile touch optimization"
```

---

## Task 18: Error Handling & Edge Cases

**Files:**
- Modify: `src/app/api/generate/route.ts`
- Modify: `src/components/shared/ConfigScreen.tsx`
- Modify: `src/app/page.tsx`

**Step 1: API error handling**

- Wrap Claude calls in try/catch with user-friendly messages
- Handle rate limits (429 from Anthropic) with "Please wait a moment" message
- Handle network errors
- Validate request body shape

**Step 2: Client error handling**

- Show error states in ConfigScreen if generation fails
- Allow retry from error state
- Handle sessionStorage being unavailable (private browsing edge case)
- Handle empty puzzle data gracefully

**Step 3: Input edge cases**

- Empty/whitespace topic: button disabled (already handled)
- 200 char truncation: already handled
- At least one category required: already handled with validation message

**Step 4: Commit**

```bash
git add src/
git commit -m "feat: comprehensive error handling and edge case coverage"
```

---

## Task 19: Deploy to Railway & Test via Cloudflare Tunnel

**Files:**
- Create: `Dockerfile` or configure Railway build settings
- Verify: `.env` variables in Railway dashboard

**Step 1: Configure Railway**

In Railway dashboard:
- Create new project from GitHub repo `rknight5/lexicon`
- Set environment variables: `ANTHROPIC_API_KEY`
- Build command: `npm run build`
- Start command: `npm start`

**Step 2: Set up Cloudflare tunnel for local testing**

```bash
# Start dev server
npm run dev

# In another terminal, start tunnel
cloudflared tunnel --url http://localhost:3000
```

The tunnel URL can be used to test on mobile devices.

**Step 3: Smoke test**

- [ ] Landing page renders
- [ ] Topic chips populate input
- [ ] Config screen loads with dynamic categories
- [ ] Puzzle generates successfully
- [ ] Grid drag interaction works (mouse)
- [ ] Grid drag interaction works (touch, via mobile)
- [ ] Lives system works (invalid word = lose life)
- [ ] Timer starts on first interaction
- [ ] Game over triggers at 0 lives
- [ ] Completion triggers when all words found
- [ ] Pause menu works
- [ ] Back to landing page works
- [ ] Responsive layout at 375px, 768px, 1024px+

**Step 4: Commit any fixes and push**

```bash
git add -A
git commit -m "fix: deployment fixes from smoke testing"
git push origin main
```

---

## Summary

| Task | Description | TDD |
|------|-------------|-----|
| 1 | Project setup (repo, Next.js, deps) | — |
| 2 | Design system (Tailwind, fonts, CSS) | — |
| 3 | TypeScript types | — |
| 4 | Grid generator algorithm | Yes |
| 5 | Response parser & word validator | Yes |
| 6 | Claude API client & /api/generate | Manual test |
| 7 | Game state reducer | Yes |
| 8 | Landing page | — |
| 9 | Config screen | — |
| 10 | Puzzle page & grid component | — |
| 11 | Word bank component | — |
| 12 | Game bar component | — |
| 13 | Modals (pause, game over, completion) | — |
| 14 | Direction snapping integration | Manual test |
| 15 | Loading state | — |
| 16 | MVP animations | — |
| 17 | Responsive & mobile touch | Manual test |
| 18 | Error handling & edge cases | — |
| 19 | Deploy & smoke test | Manual test |
