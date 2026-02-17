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
        className="w-full text-left flex items-start gap-2 transition-colors"
        style={{
          padding: "4px 6px",
          borderRadius: 6,
          borderLeft: isActive ? "2px solid #a78bfa" : "2px solid transparent",
          background: isActive ? "rgba(167, 139, 250, 0.08)" : "transparent",
        }}
      >
        <span
          className="font-grid text-xs flex-shrink-0 mt-px"
          style={{
            color: isSolved ? "#34d399" : isActive ? "#a78bfa" : "rgba(255, 255, 255, 0.45)",
            minWidth: "16px",
          }}
        >
          {clue.number}
        </span>
        <span
          className={`font-body text-[13px] leading-snug ${isSolved ? "line-through" : ""}`}
          style={{
            color: isSolved
              ? "#34d399"
              : isActive
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(255, 255, 255, 0.6)",
          }}
        >
          {clue.clue}
        </span>
      </button>
    );
  };

  return (
    <div className={`${horizontal ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"} w-full`}>
      {/* Across */}
      <div>
        <h3
          className="font-heading text-[11px] uppercase tracking-widest mb-1.5 font-semibold"
          style={{ color: "rgba(255, 255, 255, 0.5)", paddingLeft: 8 }}
        >
          Across
        </h3>
        <div className="flex flex-col">
          {acrossClues.map(renderClue)}
        </div>
      </div>

      {/* Down */}
      <div>
        <h3
          className="font-heading text-[11px] uppercase tracking-widest mb-1.5 font-semibold"
          style={{ color: "rgba(255, 255, 255, 0.5)", paddingLeft: 8 }}
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
