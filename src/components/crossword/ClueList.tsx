"use client";

import type { CrosswordClue } from "@/lib/types";

interface ClueListProps {
  clues: CrosswordClue[];
  solvedClues: number[];
  activeClueNum?: number;
  activeDirection: "across" | "down";
  onClueClick: (clue: CrosswordClue) => void;
}

export function ClueList({
  clues,
  solvedClues,
  activeClueNum,
  activeDirection,
  onClueClick,
}: ClueListProps) {
  const acrossClues = clues.filter((c) => c.direction === "across");
  const downClues = clues.filter((c) => c.direction === "down");

  const renderClue = (clue: CrosswordClue) => {
    const isSolved = solvedClues.includes(clue.number);
    const isActive =
      clue.number === activeClueNum && clue.direction === activeDirection;

    return (
      <button
        key={`${clue.direction}-${clue.number}`}
        onClick={() => onClueClick(clue)}
        className="w-full text-left px-3 py-0.5 rounded-lg transition-colors"
        style={{
          background: isActive
            ? "rgba(0, 229, 255, 0.1)"
            : "transparent",
          opacity: isSolved ? 0.5 : 1,
        }}
      >
        <span
          className="font-grid text-xs mr-2"
          style={{ color: "rgba(255, 255, 255, 0.6)" }}
        >
          {clue.number}
        </span>
        <span
          className={`font-body text-sm ${isSolved ? "line-through" : ""}`}
          style={{ color: isSolved ? "var(--color-green-accent)" : "rgba(255, 255, 255, 0.8)" }}
        >
          {clue.clue}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Across */}
      <div>
        <h3
          className="font-heading text-[11px] uppercase tracking-widest mb-1"
          style={{ color: "rgba(255, 255, 255, 0.5)" }}
        >
          Across
        </h3>
        <div className="flex flex-col">
          {acrossClues.map(renderClue)}
        </div>
      </div>

      {/* Down */}
      <div className="mt-2">
        <h3
          className="font-heading text-[11px] uppercase tracking-widest mb-1"
          style={{ color: "rgba(255, 255, 255, 0.5)" }}
        >
          Down
        </h3>
        <div className="flex flex-col">
          {downClues.map(renderClue)}
        </div>
      </div>
    </div>
  );
}
