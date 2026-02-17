"use client";

import type { CrosswordClue } from "@/lib/types";

interface ClueListProps {
  clues: CrosswordClue[];
  solvedClues: number[];
  activeClueNum?: number;
  activeDirection: "across" | "down";
  onClueClick: (clue: CrosswordClue) => void;
  horizontal?: boolean;
}

export function ClueList({
  clues,
  solvedClues,
  activeClueNum,
  activeDirection,
  onClueClick,
  horizontal,
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
        className="w-full text-left py-1.5 flex items-start gap-2 transition-colors"
        style={{
          opacity: isSolved ? 0.5 : 1,
        }}
      >
        <span
          className="font-grid text-xs flex-shrink-0 mt-px"
          style={{
            color: isActive ? "#a78bfa" : "rgba(255, 255, 255, 0.45)",
            minWidth: "16px",
          }}
        >
          {clue.number}
        </span>
        <span
          className={`font-body text-[13px] leading-relaxed ${isSolved ? "line-through" : ""}`}
          style={{
            color: isSolved
              ? "#34d399"
              : isActive
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(255, 255, 255, 0.7)",
          }}
        >
          {clue.clue}
        </span>
      </button>
    );
  };

  return (
    <div className={`${horizontal ? "grid grid-cols-2 gap-6" : "flex flex-col gap-4"} w-full`}>
      {/* Across */}
      <div>
        <h3
          className="font-heading text-[11px] uppercase tracking-widest mb-2 font-semibold"
          style={{ color: "rgba(255, 255, 255, 0.5)" }}
        >
          Across
        </h3>
        <div className="flex flex-col gap-0.5">
          {acrossClues.map(renderClue)}
        </div>
      </div>

      {/* Down */}
      <div>
        <h3
          className="font-heading text-[11px] uppercase tracking-widest mb-2 font-semibold"
          style={{ color: "rgba(255, 255, 255, 0.5)" }}
        >
          Down
        </h3>
        <div className="flex flex-col gap-0.5">
          {downClues.map(renderClue)}
        </div>
      </div>
    </div>
  );
}
