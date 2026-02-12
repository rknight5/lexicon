import type { Difficulty } from "./types";

const POINTS_PER_WORD = 100;

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  easy: 1,
  medium: 1.5,
  hard: 2,
};

/**
 * Completion-focused scoring.
 * Each word found earns base points × difficulty multiplier.
 * Lives bonus: +50% for 3 lives, +25% for 2 lives, +0% for 1 life.
 */
export function calculateScore(
  wordsFound: number,
  livesRemaining: number,
  difficulty: Difficulty
): number {
  const base = wordsFound * POINTS_PER_WORD;
  const diffMultiplier = DIFFICULTY_MULTIPLIER[difficulty];
  const livesBonus = livesRemaining >= 3 ? 1.5 : livesRemaining === 2 ? 1.25 : 1;
  return Math.round(base * diffMultiplier * livesBonus);
}
