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
    <div
      className="grid"
      style={{
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 6,
      }}
    >
      {words.map((word) => {
        const isFound = foundWords.includes(word.word);
        const hintDirection = hintedWords[word.word];

        return (
          <div
            key={word.word}
            className="flex items-center justify-center transition-all duration-200"
            style={{
              fontFamily: "var(--font-ws-mono)",
              fontSize: "11.5px",
              letterSpacing: "0.2px",
              padding: "7px 6px",
              borderRadius: 7,
              background: isFound
                ? "rgba(52, 211, 153, 0.08)"
                : "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${
                isFound
                  ? "rgba(52, 211, 153, 0.18)"
                  : "rgba(255, 255, 255, 0.06)"
              }`,
              color: isFound ? "#34d399" : "#e8e4f0",
              textDecoration: isFound ? "line-through" : "none",
              textDecorationColor: isFound
                ? "rgba(52, 211, 153, 0.3)"
                : undefined,
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {word.word}
            {!isFound && hintDirection && (
              <span
                className="ml-1"
                style={{ color: "#f7c948", fontSize: "13px" }}
              >
                {DIRECTION_ARROWS[hintDirection]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
