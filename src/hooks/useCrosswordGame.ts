import { useReducer, useEffect, useCallback, useRef } from "react";
import type {
  CrosswordPuzzleData,
  CrosswordGameState,
  CrosswordAction,
  CrosswordClue,
} from "@/lib/types";
import { CROSSWORD_DIFFICULTY_CONFIG } from "@/lib/types";

export function createInitialState(puzzle: CrosswordPuzzleData): CrosswordGameState {
  const cellValues: (string | null)[][] = puzzle.grid.map((row) =>
    row.map((cell) => (cell.letter === null ? null : ""))
  );

  // Find first active cell
  let startRow = 0;
  let startCol = 0;
  for (let r = 0; r < puzzle.gridSize; r++) {
    for (let c = 0; c < puzzle.gridSize; c++) {
      if (puzzle.grid[r][c].letter !== null) {
        startRow = r;
        startCol = c;
        r = puzzle.gridSize; // break outer
        break;
      }
    }
  }

  return {
    puzzle,
    cellValues,
    hintedCells: new Set<string>(),
    cursorRow: startRow,
    cursorCol: startCol,
    cursorDirection: "across",
    solvedClues: [],
    livesRemaining: CROSSWORD_DIFFICULTY_CONFIG[puzzle.difficulty].lives,
    hintsUsed: 0,
    elapsedSeconds: 0,
    timerRunning: false,
    gameStatus: "idle",
  };
}

function getClueAtCursor(
  puzzle: CrosswordPuzzleData,
  row: number,
  col: number,
  direction: "across" | "down"
): CrosswordClue | null {
  const cell = puzzle.grid[row][col];
  const clueNum = direction === "across" ? cell.acrossClueNum : cell.downClueNum;
  if (clueNum === undefined) return null;
  return puzzle.clues.find((c) => c.number === clueNum && c.direction === direction) ?? null;
}

function getWordCells(
  clue: CrosswordClue
): { row: number; col: number }[] {
  const dr = clue.direction === "down" ? 1 : 0;
  const dc = clue.direction === "across" ? 1 : 0;
  const cells: { row: number; col: number }[] = [];
  for (let i = 0; i < clue.length; i++) {
    cells.push({ row: clue.startRow + i * dr, col: clue.startCol + i * dc });
  }
  return cells;
}

function findNextEmptyCell(
  cellValues: (string | null)[][],
  puzzle: CrosswordPuzzleData,
  fromRow: number,
  fromCol: number,
  direction: "across" | "down"
): { row: number; col: number } | null {
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;
  let r = fromRow + dr;
  let c = fromCol + dc;

  while (r >= 0 && r < puzzle.gridSize && c >= 0 && c < puzzle.gridSize) {
    if (puzzle.grid[r][c].letter !== null && cellValues[r][c] === "") {
      return { row: r, col: c };
    }
    r += dr;
    c += dc;
  }
  return null;
}

function findNextUnsolvedClue(
  puzzle: CrosswordPuzzleData,
  cellValues: (string | null)[][],
  solvedClues: number[],
  currentClueNum: number,
  currentDirection: "across" | "down"
): { row: number; col: number; direction: "across" | "down" } | null {
  const clues = puzzle.clues.filter((c) => !solvedClues.includes(c.number) || c.number === currentClueNum);
  if (clues.length === 0) return null;

  // Find current index
  const currentIdx = clues.findIndex(
    (c) => c.number === currentClueNum && c.direction === currentDirection
  );

  // Search forward from current position
  for (let offset = 1; offset <= clues.length; offset++) {
    const clue = clues[(currentIdx + offset) % clues.length];
    if (solvedClues.includes(clue.number)) continue;

    const cells = getWordCells(clue);
    const hasEmpty = cells.some(
      ({ row, col }) => cellValues[row][col] === ""
    );
    if (hasEmpty) {
      const firstEmpty = cells.find(
        ({ row, col }) => cellValues[row][col] === ""
      )!;
      return { row: firstEmpty.row, col: firstEmpty.col, direction: clue.direction };
    }
  }

  return null;
}

export function crosswordReducer(
  state: CrosswordGameState,
  action: CrosswordAction
): CrosswordGameState {
  switch (action.type) {
    case "START_GAME":
      return { ...state, gameStatus: "playing", timerRunning: true };

    case "SELECT_CELL": {
      if (state.gameStatus !== "playing") return state;
      const cell = state.puzzle.grid[action.row][action.col];
      if (cell.letter === null) return state; // Can't select black squares

      // If tapping the same cell, toggle direction
      if (action.row === state.cursorRow && action.col === state.cursorCol) {
        const newDir = state.cursorDirection === "across" ? "down" : "across";
        // Only toggle if the cell belongs to a clue in that direction
        const hasClue = newDir === "across" ? cell.acrossClueNum !== undefined : cell.downClueNum !== undefined;
        return hasClue
          ? { ...state, cursorDirection: newDir }
          : state;
      }

      // Determine best direction for the new cell
      let newDir = state.cursorDirection;
      const hasAcross = cell.acrossClueNum !== undefined;
      const hasDown = cell.downClueNum !== undefined;
      if (hasAcross && !hasDown) newDir = "across";
      else if (hasDown && !hasAcross) newDir = "down";

      return {
        ...state,
        cursorRow: action.row,
        cursorCol: action.col,
        cursorDirection: newDir,
      };
    }

    case "TOGGLE_DIRECTION": {
      if (state.gameStatus !== "playing") return state;
      const cell = state.puzzle.grid[state.cursorRow][state.cursorCol];
      const newDir = state.cursorDirection === "across" ? "down" : "across";
      const hasClue = newDir === "across" ? cell.acrossClueNum !== undefined : cell.downClueNum !== undefined;
      return hasClue ? { ...state, cursorDirection: newDir } : state;
    }

    case "TYPE_LETTER": {
      if (state.gameStatus !== "playing") return state;
      const { cursorRow, cursorCol, cursorDirection } = state;
      const gridCell = state.puzzle.grid[cursorRow][cursorCol];
      if (gridCell.letter === null) return state;

      // Can't overwrite hinted cells
      if (state.hintedCells.has(`${cursorRow},${cursorCol}`)) {
        // Skip to next empty cell instead
        const next = findNextEmptyCell(state.cellValues, state.puzzle, cursorRow, cursorCol, cursorDirection);
        if (next) {
          return { ...state, cursorRow: next.row, cursorCol: next.col };
        }
        return state;
      }

      const newCellValues = state.cellValues.map((row) => [...row]);
      newCellValues[cursorRow][cursorCol] = action.letter.toUpperCase();

      // Advance cursor to next empty cell in current word
      const next = findNextEmptyCell(newCellValues, state.puzzle, cursorRow, cursorCol, cursorDirection);
      const nextRow = next?.row ?? cursorRow;
      const nextCol = next?.col ?? cursorCol;

      return {
        ...state,
        cellValues: newCellValues,
        cursorRow: nextRow,
        cursorCol: nextCol,
      };
    }

    case "DELETE_LETTER": {
      if (state.gameStatus !== "playing") return state;
      const { cursorRow, cursorCol, cursorDirection } = state;

      // If current cell has a letter and is not hinted, delete it
      if (state.cellValues[cursorRow][cursorCol] !== "" && state.cellValues[cursorRow][cursorCol] !== null) {
        if (state.hintedCells.has(`${cursorRow},${cursorCol}`)) return state; // Can't delete hinted
        const newCellValues = state.cellValues.map((row) => [...row]);
        newCellValues[cursorRow][cursorCol] = "";
        return { ...state, cellValues: newCellValues };
      }

      // Otherwise move back and delete
      const dr = cursorDirection === "down" ? -1 : 0;
      const dc = cursorDirection === "across" ? -1 : 0;
      const prevRow = cursorRow + dr;
      const prevCol = cursorCol + dc;

      if (
        prevRow >= 0 && prevRow < state.puzzle.gridSize &&
        prevCol >= 0 && prevCol < state.puzzle.gridSize &&
        state.puzzle.grid[prevRow][prevCol].letter !== null
      ) {
        const newCellValues = state.cellValues.map((row) => [...row]);
        newCellValues[prevRow][prevCol] = "";
        return {
          ...state,
          cellValues: newCellValues,
          cursorRow: prevRow,
          cursorCol: prevCol,
        };
      }

      return state;
    }

    case "CHECK_WORD": {
      if (state.gameStatus !== "playing") return state;
      const clue = getClueAtCursor(state.puzzle, state.cursorRow, state.cursorCol, state.cursorDirection);
      if (!clue) return state;
      if (state.solvedClues.includes(clue.number)) return state;

      const cells = getWordCells(clue);
      const playerWord = cells.map(({ row, col }) => state.cellValues[row][col] || "").join("");

      if (playerWord === clue.answer) {
        const newSolved = [...state.solvedClues, clue.number];
        const totalClues = state.puzzle.clues.length;
        const allSolved = newSolved.length === totalClues;

        // Jump to next unsolved clue
        const next = findNextUnsolvedClue(
          state.puzzle,
          state.cellValues,
          newSolved,
          clue.number,
          clue.direction
        );

        return {
          ...state,
          solvedClues: newSolved,
          cursorRow: next?.row ?? state.cursorRow,
          cursorCol: next?.col ?? state.cursorCol,
          cursorDirection: next?.direction ?? state.cursorDirection,
          gameStatus: allSolved ? "won" : state.gameStatus,
          timerRunning: allSolved ? false : state.timerRunning,
        };
      }

      // Wrong — lose a life
      const newLives = state.livesRemaining - 1;
      return {
        ...state,
        livesRemaining: newLives,
        gameStatus: newLives <= 0 ? "lost" : state.gameStatus,
        timerRunning: newLives <= 0 ? false : state.timerRunning,
      };
    }

    case "HINT": {
      if (state.gameStatus !== "playing") return state;
      if (state.livesRemaining <= 1) return state; // Can't hint at 1 life

      const clue = getClueAtCursor(state.puzzle, state.cursorRow, state.cursorCol, state.cursorDirection);
      if (!clue) return state;

      const cells = getWordCells(clue);

      // Find target cell: cursor cell if empty, otherwise first empty cell in word
      const cursorKey = `${state.cursorRow},${state.cursorCol}`;
      const cursorEmpty = state.cellValues[state.cursorRow][state.cursorCol] === "" && !state.hintedCells.has(cursorKey);
      let targetCell: { row: number; col: number } | null = null;

      if (cursorEmpty) {
        targetCell = { row: state.cursorRow, col: state.cursorCol };
      } else {
        targetCell = cells.find(
          ({ row, col }) =>
            state.cellValues[row][col] === "" && !state.hintedCells.has(`${row},${col}`)
        ) ?? null;
      }

      if (!targetCell) return state; // No empty cells to hint

      const correctLetter = state.puzzle.grid[targetCell.row][targetCell.col].letter!;
      const newCellValues = state.cellValues.map((row) => [...row]);
      newCellValues[targetCell.row][targetCell.col] = correctLetter;

      const newHintedCells = new Set(state.hintedCells);
      newHintedCells.add(`${targetCell.row},${targetCell.col}`);

      const newLives = state.livesRemaining - 1;

      // Check if this hint completed the word
      const wordComplete = cells.every(
        ({ row, col }) => newCellValues[row][col] !== "" && newCellValues[row][col] !== null
      );
      const wordCorrect = wordComplete && cells.map(({ row, col }) => newCellValues[row][col]).join("") === clue.answer;

      let newSolved = state.solvedClues;
      let newStatus: CrosswordGameState["gameStatus"] = newLives <= 0 ? "lost" : state.gameStatus;
      let newTimerRunning = newLives <= 0 ? false : state.timerRunning;

      if (wordCorrect && !state.solvedClues.includes(clue.number)) {
        newSolved = [...state.solvedClues, clue.number];
        const allSolved = newSolved.length === state.puzzle.clues.length;
        if (allSolved) {
          newStatus = "won";
          newTimerRunning = false;
        }
      }

      return {
        ...state,
        cellValues: newCellValues,
        hintedCells: newHintedCells,
        hintsUsed: state.hintsUsed + 1,
        livesRemaining: newLives,
        solvedClues: newSolved,
        gameStatus: newStatus,
        timerRunning: newTimerRunning,
      };
    }

    case "TICK_TIMER":
      if (!state.timerRunning) return state;
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 };

    case "PAUSE":
      if (state.gameStatus !== "playing") return state;
      return { ...state, gameStatus: "paused", timerRunning: false };

    case "RESUME":
      if (state.gameStatus !== "paused") return state;
      return { ...state, gameStatus: "playing", timerRunning: true };

    default:
      return state;
  }
}

const EMPTY_PUZZLE: CrosswordPuzzleData = {
  title: "",
  grid: [],
  clues: [],
  gridSize: 0,
  funFact: "",
  difficulty: "medium",
};

export function useCrosswordGame(puzzle: CrosswordPuzzleData | null) {
  const [state, dispatch] = useReducer(
    crosswordReducer,
    null,
    () => createInitialState(puzzle ?? EMPTY_PUZZLE)
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.timerRunning) {
      timerRef.current = setInterval(() => {
        dispatch({ type: "TICK_TIMER" });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.timerRunning]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && state.gameStatus === "playing") {
        dispatch({ type: "PAUSE" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.gameStatus]);

  const startGame = useCallback(() => dispatch({ type: "START_GAME" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const selectCell = useCallback(
    (row: number, col: number) => dispatch({ type: "SELECT_CELL", row, col }),
    []
  );
  const toggleDirection = useCallback(
    () => dispatch({ type: "TOGGLE_DIRECTION" }),
    []
  );
  const typeLetter = useCallback(
    (letter: string) => dispatch({ type: "TYPE_LETTER", letter }),
    []
  );
  const deleteLetter = useCallback(
    () => dispatch({ type: "DELETE_LETTER" }),
    []
  );
  const checkWord = useCallback(
    () => dispatch({ type: "CHECK_WORD" }),
    []
  );
  const useHint = useCallback(
    () => dispatch({ type: "HINT" }),
    []
  );

  return {
    state,
    startGame,
    pause,
    resume,
    selectCell,
    toggleDirection,
    typeLetter,
    deleteLetter,
    checkWord,
    useHint,
  };
}
