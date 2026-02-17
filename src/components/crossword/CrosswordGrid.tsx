"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  // Track recently solved clue for sequential fill stagger
  const [recentSolvedClue, setRecentSolvedClue] = useState<number | null>(null);
  const prevSolvedCount = useRef(solvedClues.length);

  useEffect(() => {
    if (solvedClues.length > prevSolvedCount.current) {
      const newClue = solvedClues[solvedClues.length - 1];
      setRecentSolvedClue(newClue);
      const t = setTimeout(() => setRecentSolvedClue(null), 600);
      prevSolvedCount.current = solvedClues.length;
      return () => clearTimeout(t);
    }
    prevSolvedCount.current = solvedClues.length;
  }, [solvedClues]);

  // Precompute stagger delays for recently solved clue cells
  const recentSolvedStagger = useMemo(() => {
    if (recentSolvedClue === null) return new Map<string, number>();
    const acrossCells: { row: number; col: number }[] = [];
    const downCells: { row: number; col: number }[] = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = grid[r][c];
        if (cell.acrossClueNum === recentSolvedClue) acrossCells.push({ row: r, col: c });
        if (cell.downClueNum === recentSolvedClue) downCells.push({ row: r, col: c });
      }
    }
    // Use the direction with more cells (the actual solved word)
    const isAcross = acrossCells.length >= downCells.length;
    const cells = isAcross ? acrossCells : downCells;
    cells.sort((a, b) => isAcross ? a.col - b.col : a.row - b.row);
    const map = new Map<string, number>();
    cells.forEach((c, i) => map.set(`${c.row},${c.col}`, i * 50));
    return map;
  }, [recentSolvedClue, grid, gridSize]);

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
        const containerPadding = 48; // 24px each side
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
          padding: "2px",
          background: "transparent",
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

            const cellBg = isCursor
              ? "#a78bfa"
              : inWord
              ? "rgba(167, 139, 250, 0.15)"
              : solved
              ? "rgba(52, 211, 153, 0.15)"
              : mobile
              ? "#FFFFFF"
              : "rgba(255, 255, 255, 0.08)";

            const cellColor = mobile
              ? (isCursor ? "#FFFFFF" : isHinted ? "#D4A800" : solved ? "#2E7D32" : "#1A1A2E")
              : (isCursor ? "#FFFFFF" : isHinted ? "#FFD700" : solved ? "#4ade80" : "#FFFFFF");

            const cellShadow = isCursor
              ? "0 0 10px rgba(167, 139, 250, 0.5)"
              : undefined;

            const cellBorder = isCursor
              ? "2px solid #a78bfa"
              : inWord
              ? "1px solid rgba(167, 139, 250, 0.30)"
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
                  borderRadius: "4px",
                  border: cellBorder,
                  boxShadow: cellShadow,
                  fontFamily: mobile ? "var(--font-ws-mono)" : "var(--font-grid)",
                  transition: "all 0.15s ease",
                  transitionDelay: recentSolvedStagger.has(`${rowIdx},${colIdx}`)
                    ? `${recentSolvedStagger.get(`${rowIdx},${colIdx}`)}ms`
                    : undefined,
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
                        : (isCursor ? "rgba(255,255,255,0.5)" : "rgba(255, 255, 255, 0.35)"),
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
