import type { Difficulty, GameType } from "@/lib/types";

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

const COUNT_LABELS: Record<GameType, string> = {
  wordsearch: "found",
  crossword: "solved",
  anagram: "unscrambled",
  trivia: "correct",
};

function buildProgressRow(found: number, total: number, gameType: GameType): string {
  if (gameType === "trivia") {
    return "\u2705".repeat(found) + "\u274c".repeat(total - found);
  }
  return "\ud83d\udfe9".repeat(found) + "\u2b1b".repeat(total - found);
}

export function generateShareCard(data: ShareCardData): string {
  const gameLabel = GAME_LABELS[data.gameType];
  const diffLabel = DIFFICULTY_LABELS[data.difficulty];
  const countLabel = COUNT_LABELS[data.gameType];

  const progressRow = buildProgressRow(data.wordsFound, data.wordsTotal, data.gameType);

  const lines = [
    `LEXICON \ud83e\udde9 ${data.topic}`,
    `${gameLabel} \u00b7 ${diffLabel}`,
    "",
    progressRow,
    `${data.wordsFound}/${data.wordsTotal} ${countLabel} \u00b7 \u2764\ufe0f ${data.livesRemaining} \u00b7 ${data.score}pts`,
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
