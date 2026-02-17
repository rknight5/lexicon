import type { Difficulty, GameType, CrosswordCell } from "@/lib/types";

interface ShareCardBase {
  gameType: GameType;
  topic: string;
  difficulty: Difficulty;
  wordsFound: number;
  wordsTotal: number;
  livesRemaining: number;
  score: number;
}

interface WordSearchShareCard extends ShareCardBase {
  gameType: "wordsearch";
}

interface CrosswordShareCard extends ShareCardBase {
  gameType: "crossword";
  grid: CrosswordCell[][];
  solvedClues: number[];
}

interface AnagramShareCard extends ShareCardBase {
  gameType: "anagram";
}

interface TriviaShareCard extends ShareCardBase {
  gameType: "trivia";
}

export type ShareCardData = WordSearchShareCard | CrosswordShareCard | AnagramShareCard | TriviaShareCard;

const GAME_LABELS: Record<GameType, string> = {
  wordsearch: "Word Search",
  crossword: "Crossword",
  anagram: "Anagram",
  trivia: "Trivia",
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

function buildEmojiRow(found: number, total: number): string {
  return "\ud83d\udfe9".repeat(found) + "\u2b1b".repeat(total - found);
}

function buildCrosswordGrid(grid: CrosswordCell[][], solvedClues: number[]): string {
  const solvedSet = new Set(solvedClues);
  return grid
    .map((row) => {
      const cells = row.map((cell) => {
        if (cell.letter === null) return "\u2b1c"; // white square for black cells
        const solved =
          (cell.acrossClueNum !== undefined && solvedSet.has(cell.acrossClueNum)) ||
          (cell.downClueNum !== undefined && solvedSet.has(cell.downClueNum));
        return solved ? "\ud83d\udfe9" : "\u2b1b";
      });
      return cells.join("");
    })
    .join("\n");
}

export function generateShareCard(data: ShareCardData): string {
  const gameLabel = GAME_LABELS[data.gameType];
  const diffLabel = DIFFICULTY_LABELS[data.difficulty];

  let emojiGrid: string;
  if (data.gameType === "crossword") {
    emojiGrid = buildCrosswordGrid(data.grid, data.solvedClues);
  } else {
    emojiGrid = buildEmojiRow(data.wordsFound, data.wordsTotal);
  }

  const lines = [
    `LEXICON \ud83e\udde9 ${data.topic}`,
    `${gameLabel} \u00b7 ${diffLabel}`,
    "",
    emojiGrid,
    `\u2b50 ${data.wordsFound}/${data.wordsTotal} \u00b7 \u2764\ufe0f ${data.livesRemaining} \u00b7 \ud83c\udfc6 ${data.score}pts`,
  ];

  return lines.join("\n");
}

export async function shareOrCopy(text: string): Promise<"shared" | "copied"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (err) {
      // User cancelled or share failed — fall through to copy
      if (err instanceof DOMException && err.name === "AbortError") {
        return "shared"; // user cancelled, don't show toast
      }
    }
  }
  await navigator.clipboard.writeText(text);
  return "copied";
}
