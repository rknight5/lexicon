import { useReducer, useEffect, useCallback, useRef } from "react";
import type {
  AnagramPuzzleData,
  AnagramGameState,
  AnagramAction,
} from "@/lib/types";
import { ANAGRAM_DIFFICULTY_CONFIG } from "@/lib/types";

export function createInitialState(puzzle: AnagramPuzzleData): AnagramGameState {
  return {
    puzzle,
    currentWordIndex: 0,
    solvedWords: [],
    selectedIndices: [],
    livesRemaining: ANAGRAM_DIFFICULTY_CONFIG[puzzle.difficulty].lives,
    hintsUsed: 0,
    revealedPositions: {},
    elapsedSeconds: 0,
    timerRunning: false,
    gameStatus: "idle",
  };
}

export function anagramReducer(
  state: AnagramGameState,
  action: AnagramAction
): AnagramGameState {
  switch (action.type) {
    case "START_GAME":
      return { ...state, gameStatus: "playing", timerRunning: true };

    case "SELECT_LETTER": {
      if (state.gameStatus !== "playing") return state;
      // Don't select the same scrambled letter index twice
      if (state.selectedIndices.includes(action.index)) return state;
      // Don't exceed word length
      const currentWord = state.puzzle.words[state.currentWordIndex];
      if (state.selectedIndices.length >= currentWord.word.length) return state;

      return {
        ...state,
        selectedIndices: [...state.selectedIndices, action.index],
      };
    }

    case "DESELECT_LETTER": {
      if (state.gameStatus !== "playing") return state;
      // action.index here is the answer position (index into selectedIndices)
      const answerPos = action.index;
      if (answerPos < 0 || answerPos >= state.selectedIndices.length) return state;

      // Don't allow deselecting revealed/hinted positions
      const revealed = state.revealedPositions[state.currentWordIndex] ?? [];
      if (revealed.includes(answerPos)) return state;

      const newSelected = [...state.selectedIndices];
      newSelected.splice(answerPos, 1);
      return {
        ...state,
        selectedIndices: newSelected,
      };
    }

    case "SUBMIT_WORD": {
      if (state.gameStatus !== "playing") return state;
      const currentWord = state.puzzle.words[state.currentWordIndex];
      const scrambled = currentWord.scrambled;

      // Build the player's answer from selected indices into the scrambled string
      const playerAnswer = state.selectedIndices
        .map((i) => scrambled[i])
        .join("")
        .toUpperCase();
      const correctAnswer = currentWord.word.toUpperCase();

      if (playerAnswer === correctAnswer) {
        const newSolvedWords = [...state.solvedWords, currentWord.word];
        const allDone = newSolvedWords.length === state.puzzle.words.length;

        if (allDone) {
          return {
            ...state,
            solvedWords: newSolvedWords,
            selectedIndices: [],
            gameStatus: "won",
            timerRunning: false,
          };
        }

        // Advance to next word
        return {
          ...state,
          solvedWords: newSolvedWords,
          currentWordIndex: state.currentWordIndex + 1,
          selectedIndices: [],
        };
      }

      // Wrong answer — lose a life
      const newLives = state.livesRemaining - 1;
      return {
        ...state,
        livesRemaining: newLives,
        gameStatus: newLives <= 0 ? "lost" : state.gameStatus,
        timerRunning: newLives <= 0 ? false : state.timerRunning,
      };
    }

    case "SKIP_WORD": {
      if (state.gameStatus !== "playing") return state;

      const newLives = state.livesRemaining - 1;
      if (newLives <= 0) {
        return {
          ...state,
          livesRemaining: 0,
          gameStatus: "lost",
          timerRunning: false,
        };
      }

      // Advance to next word (if any remain)
      const nextIndex = state.currentWordIndex + 1;
      const allDone = nextIndex >= state.puzzle.words.length;

      if (allDone) {
        return {
          ...state,
          livesRemaining: newLives,
          gameStatus: "lost",
          timerRunning: false,
        };
      }

      return {
        ...state,
        currentWordIndex: nextIndex,
        selectedIndices: [],
        livesRemaining: newLives,
      };
    }

    case "USE_HINT": {
      if (state.gameStatus !== "playing") return state;
      if (state.livesRemaining <= 1) return state; // Can't hint at 1 life

      const currentWord = state.puzzle.words[state.currentWordIndex];
      const scrambled = currentWord.scrambled;
      const correctWord = currentWord.word.toUpperCase();
      const revealed = state.revealedPositions[state.currentWordIndex] ?? [];

      // Find the next unrevealed answer position
      let targetPos = -1;
      for (let i = 0; i < correctWord.length; i++) {
        if (!revealed.includes(i)) {
          targetPos = i;
          break;
        }
      }
      if (targetPos === -1) return state; // All positions already revealed

      // Find the correct letter for this position
      const correctLetter = correctWord[targetPos];

      // Find an unused index in the scrambled word that has this letter
      const usedIndices = new Set(state.selectedIndices);
      let scrambledIndex = -1;
      for (let i = 0; i < scrambled.length; i++) {
        if (!usedIndices.has(i) && scrambled[i].toUpperCase() === correctLetter) {
          scrambledIndex = i;
          break;
        }
      }
      if (scrambledIndex === -1) return state; // Shouldn't happen with valid data

      // Build new selectedIndices: place the hinted letter at targetPos
      // We need to insert the scrambled index at the correct answer position
      const newSelected = [...state.selectedIndices];
      // Insert at targetPos (splice in the scrambled index)
      newSelected.splice(targetPos, 0, scrambledIndex);

      const newRevealed = {
        ...state.revealedPositions,
        [state.currentWordIndex]: [...revealed, targetPos],
      };

      const newLives = state.livesRemaining - 1;

      return {
        ...state,
        selectedIndices: newSelected,
        revealedPositions: newRevealed,
        hintsUsed: state.hintsUsed + 1,
        livesRemaining: newLives,
        gameStatus: newLives <= 0 ? "lost" : state.gameStatus,
        timerRunning: newLives <= 0 ? false : state.timerRunning,
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

    case "RESTORE_GAME":
      return { ...action.savedState, gameStatus: "playing", timerRunning: true };

    default:
      return state;
  }
}

const EMPTY_PUZZLE: AnagramPuzzleData = {
  title: "",
  words: [],
  funFact: "",
  difficulty: "medium",
};

export function useAnagramGame(puzzle: AnagramPuzzleData | null) {
  const [state, dispatch] = useReducer(
    anagramReducer,
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
  const selectLetter = useCallback(
    (index: number) => dispatch({ type: "SELECT_LETTER", index }),
    []
  );
  const deselectLetter = useCallback(
    (index: number) => dispatch({ type: "DESELECT_LETTER", index }),
    []
  );
  const submitWord = useCallback(
    () => dispatch({ type: "SUBMIT_WORD" }),
    []
  );
  const skipWord = useCallback(
    () => dispatch({ type: "SKIP_WORD" }),
    []
  );
  const useHint = useCallback(
    () => dispatch({ type: "USE_HINT" }),
    []
  );
  const restoreGame = useCallback(
    (savedState: AnagramGameState) =>
      dispatch({ type: "RESTORE_GAME", savedState }),
    []
  );

  return {
    state,
    startGame,
    pause,
    resume,
    selectLetter,
    deselectLetter,
    submitWord,
    skipWord,
    useHint,
    restoreGame,
  };
}
