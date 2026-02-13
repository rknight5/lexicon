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
  gameStatus: string;
  onSelectCell: (row: number, col: number) => void;
  onTypeLetter: (letter: string) => void;
  onDeleteLetter: () => void;
  onCheckWord: () => void;
  onToggleDirection: () => void;
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
  gameStatus,
  onSelectCell,
  onTypeLetter,
  onDeleteLetter,
  onCheckWord,
  onToggleDirection,
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

  // Cell size based on grid size
  const cellSize = gridSize <= 9 ? "w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14" : gridSize <= 11 ? "w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12" : "w-7 h-7 md:w-9 md:h-9 lg:w-10 lg:h-10";

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
        className="inline-grid select-none -ml-4 -mt-4"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: "2px",
          padding: "2px",
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
                  style={{ background: "transparent" }}
                />
              );
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={`${cellSize} relative flex items-center justify-center font-grid cursor-pointer rounded-sm`}
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
                    className="absolute top-0.5 left-1 font-body font-semibold leading-none"
                    style={{ fontSize: "9px", color: "#000000" }}
                  >
                    {cell.number}
                  </span>
                )}

                {/* Player's letter */}
                <span className={`${gridSize <= 9 ? "text-lg md:text-xl lg:text-2xl" : "text-base md:text-lg lg:text-xl"} font-semibold`}>
                  {playerLetter || ""}
                </span>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
