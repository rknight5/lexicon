"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  variant?: "mobile" | "desktop";
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
  variant,
}: CrosswordGridProps) {
  const mobile = variant === "mobile";
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

  // Dynamic cell sizing to fit viewport
  const [cellPx, setCellPx] = useState(40);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current?.parentElement) return;
      const parentWidth = containerRef.current.parentElement.clientWidth;

      if (mobile) {
        const containerPadding = 10; // 5px each side
        const gapTotal = (gridSize - 1) * 2;
        const available = parentWidth - containerPadding - gapTotal;
        const computed = Math.floor(available / gridSize);
        setCellPx(Math.max(20, Math.min(36, computed)));
      } else {
        const gapTotal = (gridSize - 1) * 2 + 4; // 2px gaps + 2px padding each side
        const available = parentWidth - gapTotal;
        const maxSize = gridSize <= 9 ? 56 : gridSize <= 11 ? 48 : 40;
        const computed = Math.floor(available / gridSize);
        setCellPx(Math.max(20, Math.min(maxSize, computed)));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [gridSize, mobile]);

  const fontSize = mobile ? 13 : Math.max(12, Math.floor(cellPx * 0.45));
  const clueNumSize = Math.max(7, Math.floor(cellPx * 0.22));

  return (
    <div className="flex flex-col items-center gap-3 w-full">
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
          gridTemplateColumns: `repeat(${gridSize}, ${cellPx}px)`,
          gap: "2px",
          padding: mobile ? "5px" : "2px",
          background: mobile ? "rgba(255, 255, 255, 0.015)" : "transparent",
          borderRadius: mobile ? "10px" : undefined,
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
                  style={{ width: cellPx, height: cellPx, background: "transparent" }}
                />
              );
            }

            const cellBg = mobile
              ? isCursor
                ? "#a78bfa"
                : inWord
                ? "rgba(167, 139, 250, 0.2)"
                : solved
                ? "rgba(52, 211, 153, 0.2)"
                : "#FFFFFF"
              : isCursor
              ? "#FFF9C4"
              : inWord
              ? "#DCEEFB"
              : solved
              ? "#E8F5E9"
              : "#FFFFFF";

            const cellColor = mobile
              ? isCursor
                ? "#FFFFFF"
                : isHinted
                ? "#D4A800"
                : solved
                ? "#2E7D32"
                : "#1A1A2E"
              : isHinted
              ? "#D4A800"
              : solved
              ? "#2E7D32"
              : "#1A1A2E";

            const cellShadow = mobile && isCursor
              ? "0 0 8px rgba(167, 139, 250, 0.4)"
              : undefined;

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className="relative flex items-center justify-center cursor-pointer"
                style={{
                  width: cellPx,
                  height: cellPx,
                  background: cellBg,
                  color: cellColor,
                  borderRadius: mobile ? "5px" : "4px",
                  boxShadow: cellShadow,
                  fontFamily: mobile ? "var(--font-ws-mono)" : "var(--font-grid)",
                  transition: "all 0.15s ease",
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
                    style={{
                      fontSize: `${clueNumSize}px`,
                      color: mobile
                        ? (isCursor ? "rgba(255,255,255,0.5)" : "rgba(0, 0, 0, 0.35)")
                        : "#000000",
                    }}
                  >
                    {cell.number}
                  </span>
                )}

                {/* Player's letter */}
                <span className="font-bold" style={{ fontSize, letterSpacing: "0.5px" }}>
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
