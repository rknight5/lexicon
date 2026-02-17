import { useReducer, useRef, useEffect, useCallback } from "react";
import type { TriviaPuzzleData, TriviaGameState, TriviaAction, Difficulty } from "@/lib/types";
import { TRIVIA_DIFFICULTY_CONFIG } from "@/lib/types";
import { calculateTriviaQuestionScore } from "@/lib/scoring";

const EMPTY_PUZZLE: TriviaPuzzleData = {
  title: "",
  questions: [],
  funFact: "",
  difficulty: "medium",
};

export function createInitialState(puzzle: TriviaPuzzleData): TriviaGameState {
  return {
    puzzle,
    currentIndex: 0,
    answers: [],
    score: 0,
    livesRemaining: TRIVIA_DIFFICULTY_CONFIG[puzzle.difficulty]?.lives ?? 3,
    hintsUsed: 0,
    eliminatedOptions: puzzle.questions.map(() => []),
    elapsedSeconds: 0,
    timerRunning: false,
    gameStatus: "idle",
  };
}

export function triviaReducer(state: TriviaGameState, action: TriviaAction): TriviaGameState {
  switch (action.type) {
    case "START_GAME":
      return { ...state, gameStatus: "playing", timerRunning: true };

    case "SELECT_ANSWER": {
      if (state.gameStatus !== "playing") return state;
      const question = state.puzzle.questions[state.currentIndex];
      if (!question) return state;
      // Already answered this question
      if (state.answers.length > state.currentIndex) return state;

      const isCorrect = action.index === question.correctIndex;
      const newAnswers = [...state.answers, isCorrect ? "correct" as const : "wrong" as const];
      const newScore = isCorrect
        ? state.score + calculateTriviaQuestionScore(state.puzzle.difficulty, action.timeRemaining, action.timeTotal)
        : state.score;
      const newLives = isCorrect ? state.livesRemaining : state.livesRemaining - 1;

      // Check if game over (lost)
      if (newLives <= 0) {
        return {
          ...state,
          answers: newAnswers,
          score: newScore,
          livesRemaining: 0,
          timerRunning: false,
          gameStatus: "lost",
        };
      }

      return {
        ...state,
        answers: newAnswers,
        score: newScore,
        livesRemaining: newLives,
        timerRunning: false, // Pause timer between questions
      };
    }

    case "USE_HINT": {
      if (state.gameStatus !== "playing") return state;
      if (state.hintsUsed >= 3) return state;
      const currentQ = state.puzzle.questions[state.currentIndex];
      if (!currentQ || currentQ.type !== "mc") return state;
      // Already answered
      if (state.answers.length > state.currentIndex) return state;

      const eliminated = state.eliminatedOptions[state.currentIndex] ?? [];
      // Find wrong options that haven't been eliminated
      const wrongOptions = currentQ.options
        .map((_, i) => i)
        .filter((i) => i !== currentQ.correctIndex && !eliminated.includes(i));
      if (wrongOptions.length === 0) return state;

      // Pick a random wrong option to eliminate
      const toEliminate = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      const newEliminated = [...state.eliminatedOptions];
      newEliminated[state.currentIndex] = [...eliminated, toEliminate];

      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        eliminatedOptions: newEliminated,
      };
    }

    case "TIME_UP": {
      if (state.gameStatus !== "playing") return state;
      // Already answered
      if (state.answers.length > state.currentIndex) return state;

      const newAnswers = [...state.answers, "skipped" as const];
      const newLives = state.livesRemaining - 1;

      if (newLives <= 0) {
        return {
          ...state,
          answers: newAnswers,
          livesRemaining: 0,
          timerRunning: false,
          gameStatus: "lost",
        };
      }

      return {
        ...state,
        answers: newAnswers,
        livesRemaining: newLives,
        timerRunning: false,
      };
    }

    case "NEXT_QUESTION": {
      if (state.gameStatus !== "playing" && state.gameStatus !== "idle") return state;
      const nextIndex = state.currentIndex + 1;

      // Check if all questions answered → won
      if (nextIndex >= state.puzzle.questions.length) {
        return {
          ...state,
          timerRunning: false,
          gameStatus: "won",
        };
      }

      return {
        ...state,
        currentIndex: nextIndex,
        timerRunning: true,
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
      // Only resume timer if current question hasn't been answered
      const shouldRunTimer = state.answers.length <= state.currentIndex;
      return { ...state, gameStatus: "playing", timerRunning: shouldRunTimer };

    case "RESTORE_GAME":
      return { ...action.savedState, timerRunning: true, gameStatus: "playing" };

    default:
      return state;
  }
}

export function useTriviaGame(puzzle: TriviaPuzzleData | null) {
  const [state, dispatch] = useReducer(
    triviaReducer,
    null,
    () => createInitialState(puzzle ?? EMPTY_PUZZLE)
  );

  // --- Elapsed-seconds timer (1s interval) ---
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

  // --- Per-question countdown timer (requestAnimationFrame) ---
  const config = TRIVIA_DIFFICULTY_CONFIG[state.puzzle.difficulty] ?? TRIVIA_DIFFICULTY_CONFIG.medium;
  const timeTotal = config.timePerQuestion * 1000; // ms
  const questionStartRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const [timeRemaining, setTimeRemaining] = useTimeRemaining(timeTotal);

  // Start/stop countdown when timerRunning changes or question changes
  useEffect(() => {
    if (state.timerRunning && state.answers.length <= state.currentIndex) {
      questionStartRef.current = performance.now();
      const tick = () => {
        const elapsed = performance.now() - questionStartRef.current;
        const remaining = Math.max(0, timeTotal - elapsed);
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          dispatch({ type: "TIME_UP" });
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(rafRef.current);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [state.timerRunning, state.currentIndex, state.answers.length, timeTotal, setTimeRemaining]);

  // Pause on tab visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && state.gameStatus === "playing") {
        dispatch({ type: "PAUSE" });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [state.gameStatus]);

  // Callbacks
  const startGame = useCallback(() => dispatch({ type: "START_GAME" }), []);
  const pause = useCallback(() => dispatch({ type: "PAUSE" }), []);
  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);
  const useHint = useCallback(() => dispatch({ type: "USE_HINT" }), []);
  const nextQuestion = useCallback(() => dispatch({ type: "NEXT_QUESTION" }), []);

  const selectAnswer = useCallback((index: number, currentTimeRemaining: number) => {
    dispatch({
      type: "SELECT_ANSWER",
      index,
      timeRemaining: currentTimeRemaining,
      timeTotal,
    });
  }, [timeTotal]);

  const restoreGame = useCallback((savedState: TriviaGameState) => {
    dispatch({ type: "RESTORE_GAME", savedState });
  }, []);

  return {
    state,
    timeRemaining,
    timeTotal,
    startGame,
    pause,
    resume,
    selectAnswer,
    useHint,
    nextQuestion,
    restoreGame,
  };
}

// Simple hook to hold timeRemaining as state (used by rAF loop)
function useTimeRemaining(initial: number): [number, (v: number) => void] {
  const [value, setValue] = useReducer((_: number, next: number) => next, initial);
  return [value, setValue];
}
