"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { CellPosition } from "@/lib/types";

interface PuzzleGridProps {
  grid: string[][];
  gridSize: number;
  gridCols?: number;
  gridRows?: number;
  selectedCells: CellPosition[];
  foundPaths: CellPosition[][];
  gameStatus: string;
  onCellPointerDown: (cell: CellPosition) => void;
  onSelectionChange: (cells: CellPosition[]) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  lastMissTimestamp?: number;
  lastFoundTimestamp?: number;
  variant?: "mobile" | "desktop";
}

function isCellInList(cells: CellPosition[], row: number, col: number): boolean {
  return cells.some((c) => c.row === row && c.col === col);
}

function isCellFound(foundPaths: CellPosition[][], row: number, col: number): boolean {
  return foundPaths.some((path) => isCellInList(path, row, col));
}

/**
 * Given a start cell and a current pointer cell, snap to the nearest
 * valid 8-direction line and return all cells along that line from
 * start to the projected end point.
 */
export function getSnappedCells(
  start: CellPosition,
  current: CellPosition,
  gridSize: number,
  gridCols?: number,
  gridRows?: number
): CellPosition[] {
  const cols = gridCols ?? gridSize;
  const rows = gridRows ?? gridSize;
  const dr = current.row - start.row;
  const dc = current.col - start.col;

  if (dr === 0 && dc === 0) return [start];

  // Calculate angle and snap to nearest 45 degrees
  const angle = Math.atan2(dr, dc);
  const snapped = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

  // Get direction deltas (will be -1, 0, or 1)
  const dirR = Math.round(Math.sin(snapped));
  const dirC = Math.round(Math.cos(snapped));

  if (dirR === 0 && dirC === 0) return [start];

  // Calculate how many steps along this direction
  const distance = Math.max(Math.abs(dr), Math.abs(dc));

  const cells: CellPosition[] = [];
  for (let i = 0; i <= distance; i++) {
    const row = start.row + i * dirR;
    const col = start.col + i * dirC;
    if (row < 0 || row >= rows || col < 0 || col >= cols) break;
    cells.push({ row, col });
  }

  return cells;
}

export function PuzzleGrid({
  grid,
  gridSize,
  gridCols,
  gridRows,
  selectedCells,
  foundPaths,
  gameStatus,
  onCellPointerDown,
  onSelectionChange,
  onPointerUp,
  onPointerLeave,
  lastMissTimestamp = 0,
  lastFoundTimestamp = 0,
  variant,
}: PuzzleGridProps) {
  const cols = gridCols ?? gridSize;
  const rows = gridRows ?? gridSize;
  const mobile = variant === "mobile";
  const [shaking, setShaking] = useState(false);
  const [flashingGreen, setFlashingGreen] = useState(false);
  const isDragging = useRef(false);
  const startCell = useRef<CellPosition | null>(null);
  const lastCell = useRef<CellPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(28);

  // Dynamically compute cell size to fit within the container
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current?.parentElement) return;
      const parentWidth = containerRef.current.parentElement.clientWidth;

      if (mobile) {
        // Mobile: fit grid width with padding, account for gap
        const wrapperPadding = 8; // 4px each side
        const containerPadding = 10; // 5px each side
        const gapTotal = (cols - 1) * 2; // 2px gap
        const available = parentWidth - wrapperPadding - containerPadding - gapTotal;
        const computed = Math.floor(available / cols);
        setCellSize(Math.max(20, Math.min(36, computed)));
      } else {
        // Desktop: match mobile grid style with gap
        const containerPadding = 10; // 5px each side
        const gapTotal = (cols - 1) * 2; // 2px gap
        const available = parentWidth - containerPadding - gapTotal;
        const maxSize = cols <= 15 ? 40 : 32;
        const computed = Math.floor(available / cols);
        setCellSize(Math.max(16, Math.min(maxSize, computed)));
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [cols, mobile]);

  const fontSize = mobile ? 13 : Math.max(12, Math.floor(cellSize * 0.7));

  useEffect(() => {
    if (lastMissTimestamp > 0) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 300);
      return () => clearTimeout(t);
    }
  }, [lastMissTimestamp]);

  const lastFoundPathRef = useRef<CellPosition[]>([]);

  useEffect(() => {
    if (lastFoundTimestamp > 0 && foundPaths.length > 0) {
      lastFoundPathRef.current = foundPaths[foundPaths.length - 1];
      setFlashingGreen(true);
      const t = setTimeout(() => setFlashingGreen(false), 200);
      return () => clearTimeout(t);
    }
  }, [lastFoundTimestamp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Convert client coordinates to grid row/col via coordinate math.
  // Works for both mouse and touch — no elementFromPoint needed.
  const cellToRowCol = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return null;
      const rect = containerRef.current.getBoundingClientRect();
      const pad = 5;
      const gap = 2;
      const step = cellSize + gap;
      const col = Math.floor((clientX - rect.left - pad) / step);
      const row = Math.floor((clientY - rect.top - pad) / step);
      return { row, col };
    },
    [cellSize, mobile]
  );

  // Pointer events only — handles both mouse and touch.
  // No setPointerCapture: touch has implicit capture, and explicit capture
  // triggers pointercancel on iOS Safari.
  const handleGridPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pos = cellToRowCol(e.clientX, e.clientY);
      if (!pos || pos.row < 0 || pos.row >= rows || pos.col < 0 || pos.col >= cols) return;
      if (gameStatus !== "playing" && gameStatus !== "idle") return;
      isDragging.current = true;
      startCell.current = pos;
      lastCell.current = null;
      onCellPointerDown(pos);
    },
    [gameStatus, cols, rows, cellToRowCol, onCellPointerDown]
  );

  const handleGridPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging.current || !startCell.current) return;
      const pos = cellToRowCol(e.clientX, e.clientY);
      if (!pos) return;
      const row = Math.max(0, Math.min(rows - 1, pos.row));
      const col = Math.max(0, Math.min(cols - 1, pos.col));
      if (lastCell.current?.row === row && lastCell.current?.col === col) return;
      lastCell.current = { row, col };
      const snapped = getSnappedCells(startCell.current, { row, col }, gridSize, cols, rows);
      onSelectionChange(snapped);
    },
    [gridSize, cols, rows, cellToRowCol, onSelectionChange]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    startCell.current = null;
    lastCell.current = null;
    onPointerUp();
  }, [onPointerUp]);

  const handlePointerEnd = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      startCell.current = null;
      lastCell.current = null;
      onPointerLeave();
    }
  }, [onPointerLeave]);

  const cellClass = mobile ? "ws-grid-cell" : "grid-cell";
  const selectingClass = mobile ? "ws-grid-cell--selecting" : "grid-cell--selecting";
  const foundClass = mobile ? "ws-grid-cell--found" : "grid-cell--found";

  return (
    <div
      ref={containerRef}
      className={`inline-grid select-none ${shaking ? "animate-shake" : ""}`}
      style={{
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap: "2px",
        padding: "5px",
        background: "rgba(255, 255, 255, 0.015)",
        borderRadius: "10px",
        touchAction: "none",
      }}
      onPointerDown={handleGridPointerDown}
      onPointerMove={handleGridPointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
    >
      {grid.map((row, rowIdx) =>
        row.map((letter, colIdx) => {
          const isSelected = isCellInList(selectedCells, rowIdx, colIdx);
          const isFound = isCellFound(foundPaths, rowIdx, colIdx);
          const isJustFound = flashingGreen && isCellInList(lastFoundPathRef.current, rowIdx, colIdx);

          return (
            <div
              key={`${rowIdx}-${colIdx}`}
              data-row={rowIdx}
              data-col={colIdx}
              className={`
                ${cellClass}
                ${isSelected ? selectingClass : ""}
                ${isFound ? foundClass : ""}
                flex items-center justify-center
                cursor-pointer
                relative
              `}
              style={{
                width: cellSize,
                height: cellSize,
                fontSize,
                fontFamily: mobile ? "var(--font-ws-mono)" : "var(--font-grid)",
                aspectRatio: "1",
              }}
            >
              {letter}
              {isJustFound && (
                <div
                  className="absolute inset-0 rounded-[inherit] animate-flash-found pointer-events-none"
                  style={{ background: "white" }}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
