import { useReducer, useEffect, useCallback, useRef } from "react";
import type {
  PuzzleData,
  WordSearchGameState,
  WordSearchAction,
  CellPosition,
} from "@/lib/types";

export function createInitialState(puzzle: PuzzleData): WordSearchGameState {
  return {
    puzzle,
    foundWords: [],
    foundPaths: [],
    selectedCells: [],
    selectionDirection: null,
    livesRemaining: 3,
    elapsedSeconds: 0,
    timerRunning: false,
    gameStatus: "idle",
  };
}

function getSelectedWord(
  grid: string[][],
  cells: CellPosition[]
): string {
  return cells.map((c) => grid[c.row][c.col]).join("");
}

function checkWordMatch(
  selectedWord: string,
  remainingWords: string[]
): string | null {
  // Check forward
  if (remainingWords.includes(selectedWord)) return selectedWord;
  // Check reverse
  const reversed = selectedWord.split("").reverse().join("");
  if (remainingWords.includes(reversed)) return reversed;
  return null;
}

export function wordSearchReducer(
  state: WordSearchGameState,
  action: WordSearchAction
): WordSearchGameState {
  switch (action.type) {
    case "START_GAME":
      return { ...state, gameStatus: "playing", timerRunning: true };

    case "START_SELECTION":
      if (state.gameStatus !== "playing") return state;
      return {
        ...state,
        selectedCells: [action.cell],
        selectionDirection: null,
      };

    case "EXTEND_SELECTION": {
      if (state.gameStatus !== "playing" || state.selectedCells.length === 0)
        return state;
      return {
        ...state,
        selectedCells: [...state.selectedCells, action.cell],
      };
    }

    case "SET_SELECTION": {
      if (state.gameStatus !== "playing") return state;
      return { ...state, selectedCells: action.cells };
    }

    case "COMPLETE_SELECTION": {
      if (state.selectedCells.length < 2) {
        // Single cell click — just clear, no penalty
        return { ...state, selectedCells: [], selectionDirection: null };
      }

      const selectedWord = getSelectedWord(
        state.puzzle.grid,
        state.selectedCells
      );
      const remainingWords = state.puzzle.words
        .map((w) => w.word)
        .filter((w) => !state.foundWords.includes(w));
      const matchedWord = checkWordMatch(selectedWord, remainingWords);

      if (matchedWord) {
        const newFoundWords = [...state.foundWords, matchedWord];
        const newFoundPaths = [...state.foundPaths, [...state.selectedCells]];
        const allFound = newFoundWords.length === state.puzzle.words.length;

        return {
          ...state,
          foundWords: newFoundWords,
          foundPaths: newFoundPaths,
          selectedCells: [],
          selectionDirection: null,
          gameStatus: allFound ? "won" : state.gameStatus,
          timerRunning: allFound ? false : state.timerRunning,
        };
      }

      // Invalid word — lose a life
      const newLives = state.livesRemaining - 1;
      return {
        ...state,
        selectedCells: [],
        selectionDirection: null,
        livesRemaining: newLives,
        gameStatus: newLives <= 0 ? "lost" : state.gameStatus,
        timerRunning: newLives <= 0 ? false : state.timerRunning,
      };
    }

    case "CANCEL_SELECTION":
      return { ...state, selectedCells: [], selectionDirection: null };

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

export function useWordSearchGame(puzzle: PuzzleData | null) {
  const [state, dispatch] = useReducer(
    wordSearchReducer,
    null,
    () =>
      puzzle
        ? createInitialState(puzzle)
        : createInitialState({
            title: "",
            grid: [],
            words: [],
            gridSize: 0,
            funFact: "",
            difficulty: "medium",
          })
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
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

  // Pause on tab hidden
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
  const startSelection = useCallback(
    (cell: CellPosition) => dispatch({ type: "START_SELECTION", cell }),
    []
  );
  const extendSelection = useCallback(
    (cell: CellPosition) => dispatch({ type: "EXTEND_SELECTION", cell }),
    []
  );
  const setSelection = useCallback(
    (cells: CellPosition[]) => dispatch({ type: "SET_SELECTION", cells }),
    []
  );
  const completeSelection = useCallback(
    () => dispatch({ type: "COMPLETE_SELECTION" }),
    []
  );
  const cancelSelection = useCallback(
    () => dispatch({ type: "CANCEL_SELECTION" }),
    []
  );

  return {
    state,
    startGame,
    pause,
    resume,
    startSelection,
    extendSelection,
    setSelection,
    completeSelection,
    cancelSelection,
  };
}
