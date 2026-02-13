"use client";

import type { PlacedWord, Direction } from "@/lib/types";

const DIRECTION_ARROWS: Record<Direction, string> = {
  right: "\u2192",
  left: "\u2190",
  down: "\u2193",
  up: "\u2191",
  downRight: "\u2198",
  downLeft: "\u2199",
  upRight: "\u2197",
  upLeft: "\u2196",
};

interface WordListProps {
  words: PlacedWord[];
  foundWords: string[];
  hintedWords: Record<string, Direction>;
}

export function WordList({ words, foundWords, hintedWords }: WordListProps) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-1">
      {words.map((word) => {
        const isFound = foundWords.includes(word.word);
        const hintDirection = hintedWords[word.word];

        return (
          <span
            key={word.word}
            className={`font-bold text-xs tracking-wide font-body flex items-center gap-1.5 ${isFound ? "text-green-accent line-through opacity-50" : "text-white"}`}
          >
            {word.word}
            {isFound && <span className="text-green-accent text-xs no-underline inline-block" style={{ textDecoration: "none" }}>{"\u2713"}</span>}
            {!isFound && hintDirection && (
              <span
                className="text-sm"
                style={{ color: "var(--color-gold-primary)" }}
              >
                {DIRECTION_ARROWS[hintDirection]}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
