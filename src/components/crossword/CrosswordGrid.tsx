"use client";

import { useCallback, useEffect, useRef } from "react";
import type { CrosswordCell } from "@/lib/types";

interface CrosswordGridProps {
  grid: CrosswordCell[][];
  gridSize: number;
  cellValues: (string | null)[][];
  hintedCells: Set<string>;
  cursorRow: number;
  cursorCol: number;
  cursorDirection: "across" | "down";
  solvedClues: number[];
  livesRemaining: number;
  gameStatus: string;
  onSelectCell: (row: number, col: number) => void;
  onTypeLetter: (letter: string) => void;
  onDeleteLetter: () => void;
  onCheckWord: () => void;
  onToggleDirection: () => void;
  onHint: () => void;
}

export function CrosswordGrid({
  grid,
  gridSize,
  cellValues,
  hintedCells,
  cursorRow,
  cursorCol,
  cursorDirection,
  solvedClues,
  livesRemaining,
  gameStatus,
  onSelectCell,
  onTypeLetter,
  onDeleteLetter,
  onCheckWord,
  onToggleDirection,
  onHint,
}: CrosswordGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Get the active clue number for highlighting the full word
  const activeCell = grid[cursorRow]?.[cursorCol];
  const activeClueNum =
    cursorDirection === "across"
      ? activeCell?.acrossClueNum
      : activeCell?.downClueNum;

  // Focus hidden input for keyboard capture
  const focusInput = useCallback(() => {
    hiddenInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (gameStatus === "playing") {
      focusInput();
    }
  }, [gameStatus, focusInput]);

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== "playing") return;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onDeleteLetter();
        return;
      }

      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        onCheckWord();
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        onToggleDirection();
        return;
      }

      // Arrow keys
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const dr = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        const dc = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        const newRow = cursorRow + dr;
        const newCol = cursorCol + dc;
        if (
          newRow >= 0 && newRow < gridSize &&
          newCol >= 0 && newCol < gridSize &&
          grid[newRow][newCol].letter !== null
        ) {
          onSelectCell(newRow, newCol);
        }
        return;
      }

      // Letter input
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        onTypeLetter(e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStatus, cursorRow, cursorCol, gridSize, grid, onTypeLetter, onDeleteLetter, onCheckWord, onToggleDirection, onSelectCell]);

  const isInActiveWord = (row: number, col: number): boolean => {
    if (activeClueNum === undefined) return false;
    const cell = grid[row][col];
    return cursorDirection === "across"
      ? cell.acrossClueNum === activeClueNum
      : cell.downClueNum === activeClueNum;
  };

  const isSolvedCell = (row: number, col: number): boolean => {
    const cell = grid[row][col];
    return (
      (cell.acrossClueNum !== undefined && solvedClues.includes(cell.acrossClueNum)) ||
      (cell.downClueNum !== undefined && solvedClues.includes(cell.downClueNum))
    );
  };

  // Cell size based on grid size — scale up at lg to match word search
  const cellSize = gridSize <= 9 ? "w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12" : gridSize <= 11 ? "w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" : "w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Hidden input for mobile keyboard */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="sr-only"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        inputMode="text"
        aria-label="Crossword input"
        onInput={(e) => {
          const value = (e.target as HTMLInputElement).value;
          if (value && /^[a-zA-Z]$/.test(value)) {
            onTypeLetter(value);
          }
          (e.target as HTMLInputElement).value = "";
        }}
      />

      <div
        ref={containerRef}
        className="inline-grid select-none"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: "1px",
          padding: "2px",
          background: "#000000",
          borderRadius: "4px",
        }}
        onClick={focusInput}
      >
        {grid.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const isBlack = cell.letter === null;
            const isCursor = rowIdx === cursorRow && colIdx === cursorCol;
            const inWord = isInActiveWord(rowIdx, colIdx);
            const solved = isSolvedCell(rowIdx, colIdx);
            const playerLetter = cellValues[rowIdx]?.[colIdx];
            const isHinted = hintedCells.has(`${rowIdx},${colIdx}`);

            if (isBlack) {
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`${cellSize}`}
                  style={{ background: "#000000" }}
                />
              );
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`${cellSize} relative flex items-center justify-center font-grid cursor-pointer`}
                style={{
                  background: isCursor
                    ? "#FFF9C4"
                    : inWord
                    ? "#DCEEFB"
                    : solved
                    ? "#E8F5E9"
                    : "#FFFFFF",
                  color: isHinted ? "#D4A800" : solved ? "#2E7D32" : "#1A1A2E",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCell(rowIdx, colIdx);
                  focusInput();
                }}
              >
                {/* Clue number */}
                {cell.number !== undefined && (
                  <span
                    className="absolute top-px left-0.5 font-body font-semibold leading-none"
                    style={{ fontSize: "8px", color: "#000000" }}
                  >
                    {cell.number}
                  </span>
                )}

                {/* Player's letter */}
                <span className={`${gridSize <= 9 ? "text-base md:text-lg lg:text-xl" : "text-sm md:text-base lg:text-lg"} font-semibold`}>
                  {playerLetter || ""}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Action buttons */}
      {gameStatus === "playing" && (
        <div className="flex gap-3">
          <button
            onClick={onHint}
            disabled={livesRemaining <= 1}
            className="px-5 py-2 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
            style={{
              background: "rgba(255, 215, 0, 0.12)",
              border: "1px solid rgba(255, 215, 0, 0.3)",
              color: "#FFD700",
            }}
          >
            <span className="mr-1.5">💡</span>Hint
          </button>
          <button
            onClick={onCheckWord}
            className="px-5 py-2 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            Check Word
          </button>
        </div>
      )}
    </div>
  );
}
