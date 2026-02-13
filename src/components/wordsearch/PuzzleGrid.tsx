"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import type { CellPosition } from "@/lib/types";

interface PuzzleGridProps {
  grid: string[][];
  gridSize: number;
  selectedCells: CellPosition[];
  foundPaths: CellPosition[][];
  gameStatus: string;
  onCellPointerDown: (cell: CellPosition) => void;
  onSelectionChange: (cells: CellPosition[]) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  lastMissTimestamp?: number;
  lastFoundTimestamp?: number;
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
  gridSize: number
): CellPosition[] {
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
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) break;
    cells.push({ row, col });
  }

  return cells;
}

export function PuzzleGrid({
  grid,
  gridSize,
  selectedCells,
  foundPaths,
  gameStatus,
  onCellPointerDown,
  onSelectionChange,
  onPointerUp,
  onPointerLeave,
  lastMissTimestamp = 0,
  lastFoundTimestamp = 0,
}: PuzzleGridProps) {
  const [shaking, setShaking] = useState(false);
  const [flashingGreen, setFlashingGreen] = useState(false);
  const isDragging = useRef(false);
  const startCell = useRef<CellPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(28);

  // Dynamically compute cell size to fit within the container
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current?.parentElement) return;
      const parentWidth = containerRef.current.parentElement.clientWidth;
      const padding = 24; // p-3 = 12px each side
      const available = parentWidth - padding;
      const maxSize = gridSize <= 15 ? 40 : 32; // desktop max
      const computed = Math.floor(available / gridSize);
      setCellSize(Math.max(16, Math.min(maxSize, computed)));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [gridSize]);

  const fontSize = Math.max(10, Math.floor(cellSize * 0.45));

  useEffect(() => {
    if (lastMissTimestamp > 0) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 300);
      return () => clearTimeout(t);
    }
  }, [lastMissTimestamp]);

  useEffect(() => {
    if (lastFoundTimestamp > 0) {
      setFlashingGreen(true);
      const t = setTimeout(() => setFlashingGreen(false), 500);
      return () => clearTimeout(t);
    }
  }, [lastFoundTimestamp]);

  const handlePointerDown = useCallback(
    (row: number, col: number) => {
      if (gameStatus !== "playing" && gameStatus !== "idle") return;
      isDragging.current = true;
      startCell.current = { row, col };
      onCellPointerDown({ row, col });
    },
    [gameStatus, onCellPointerDown]
  );

  const handlePointerEnter = useCallback(
    (row: number, col: number) => {
      if (!isDragging.current || !startCell.current) return;
      const snapped = getSnappedCells(startCell.current, { row, col }, gridSize);
      onSelectionChange(snapped);
    },
    [gridSize, onSelectionChange]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    startCell.current = null;
    onPointerUp();
  }, [onPointerUp]);

  const handlePointerLeaveGrid = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      startCell.current = null;
      onPointerLeave();
    }
  }, [onPointerLeave]);

  return (
    <div
      ref={containerRef}
      className={`inline-grid gap-0 p-3 rounded-xl select-none ${shaking ? "animate-shake" : ""}`}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
        background: "#FFFFFF",
        borderRadius: "12px",
        touchAction: "none",
      }}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeaveGrid}
      onPointerCancel={handlePointerLeaveGrid}
    >
      {grid.map((row, rowIdx) =>
        row.map((letter, colIdx) => {
          const isSelected = isCellInList(selectedCells, rowIdx, colIdx);
          const isFound = isCellFound(foundPaths, rowIdx, colIdx);

          return (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={`
                grid-cell
                ${isSelected ? "grid-cell--selecting" : ""}
                ${isFound ? "grid-cell--found" : ""}
                flex items-center justify-center
                font-grid cursor-pointer
              `}
              style={{ width: cellSize, height: cellSize, fontSize }}
              onPointerDown={() => handlePointerDown(rowIdx, colIdx)}
              onPointerEnter={() => handlePointerEnter(rowIdx, colIdx)}
            >
              {letter}
            </div>
          );
        })
      )}
    </div>
  );
}
