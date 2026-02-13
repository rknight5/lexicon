"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { GameBar } from "@/components/shared/GameBar";
import { GameStatsBar } from "@/components/shared/GameStatsBar";
import { PauseMenu } from "@/components/shared/PauseMenu";
import { GameOverModal } from "@/components/shared/GameOverModal";
import { CompletionModal } from "@/components/shared/CompletionModal";
import { StatsModal } from "@/components/shared/StatsModal";
import { useAnagramGame } from "@/hooks/useAnagramGame";
import { calculateScore } from "@/lib/scoring";
import { saveResult, savePuzzle } from "@/lib/storage";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Toast } from "@/components/shared/Toast";
import { SessionExpiredModal } from "@/components/shared/SessionExpiredModal";
import { Bookmark } from "lucide-react";
import { ANAGRAM_DIFFICULTY_CONFIG } from "@/lib/types";
import type { AnagramPuzzleData } from "@/lib/types";

export default function AnagramPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<AnagramPuzzleData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lexicon-puzzle-anagram");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setPuzzle(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem("lexicon-puzzle-anagram");
      router.push("/");
    }
  }, [router]);

  if (!puzzle) return null;

  return <AnagramGame puzzle={puzzle} />;
}

function AnagramGame({ puzzle: initialPuzzle }: { puzzle: AnagramPuzzleData }) {
  const router = useRouter();
  const [puzzleTitle, setPuzzleTitle] = useState(initialPuzzle.title);
  const [showStats, setShowStats] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const puzzle = initialPuzzle;
  const {
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
  } = useAnagramGame(puzzle);

  // Restore saved game state if present
  useEffect(() => {
    const savedState = sessionStorage.getItem("lexicon-game-state");
    if (savedState) {
      restoreGame(JSON.parse(savedState));
      sessionStorage.removeItem("lexicon-game-state");
    }
  }, [restoreGame]);

  const getGameState = useCallback(() => {
    return { ...state } as unknown as Record<string, unknown>;
  }, [state]);

  useAutoSave({
    gameType: "anagram",
    title: puzzleTitle,
    difficulty: puzzle.difficulty,
    puzzleData: puzzle,
    gameStatus: state.gameStatus,
    getGameState,
    onSessionExpired: () => setSessionExpired(true),
  });

  const [lastMissTimestamp, setLastMissTimestamp] = useState(0);
  const prevLives = useRef(state.livesRemaining);

  useEffect(() => {
    if (state.livesRemaining < prevLives.current) {
      setLastMissTimestamp(Date.now());
    }
    prevLives.current = state.livesRemaining;
  }, [state.livesRemaining]);

  // Save result when game ends
  const savedRef = useRef(false);
  useEffect(() => {
    if (
      (state.gameStatus === "won" || state.gameStatus === "lost") &&
      !savedRef.current
    ) {
      savedRef.current = true;
      void saveResult({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: puzzle.title,
        gameType: "anagram",
        difficulty: puzzle.difficulty,
        score: calculateScore(
          state.solvedWords.length,
          state.livesRemaining,
          puzzle.difficulty
        ),
        wordsFound: state.solvedWords.length,
        wordsTotal: puzzle.words.length,
        elapsedSeconds: state.elapsedSeconds,
        livesRemaining: state.livesRemaining,
        hintsUsed: state.hintsUsed,
        outcome: state.gameStatus,
      });
    }
  }, [
    state.gameStatus,
    state.solvedWords.length,
    state.livesRemaining,
    state.elapsedSeconds,
    state.hintsUsed,
    puzzle,
  ]);

  const handleFirstInteraction = () => {
    if (state.gameStatus === "idle") {
      startGame();
    }
  };

  const handleNewTopic = () => {
    sessionStorage.removeItem("lexicon-puzzle-anagram");
    sessionStorage.removeItem("lexicon-game-state");
    router.push("/");
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem("lexicon-puzzle-anagram");
    sessionStorage.removeItem("lexicon-game-state");
    router.push("/");
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await savePuzzle("anagram", puzzle.title, puzzle.difficulty, puzzle);
      if (result.id) {
        setIsSaved(true);
        setToastMessage("Saved to library");
      } else if (result.error === "session-expired") {
        setSessionExpired(true);
      } else if (result.error === "network") {
        setToastMessage("No connection — try again when you're online");
      } else {
        setToastMessage("Couldn't save — try again");
      }
    } catch {
      setToastMessage("Couldn't save — try again");
    } finally {
      setIsSaving(false);
    }
  };

  const score = calculateScore(
    state.solvedWords.length,
    state.livesRemaining,
    puzzle.difficulty
  );

  const canHint =
    (state.gameStatus === "playing" || state.gameStatus === "idle") &&
    state.livesRemaining > 1;

  const currentWord = state.puzzle.words[state.currentWordIndex];
  const showClues = ANAGRAM_DIFFICULTY_CONFIG[puzzle.difficulty].showClues;
  const allSlotsFilled =
    currentWord && state.selectedIndices.length === currentWord.word.length;

  // Build the answer string from selected indices
  const answerLetters = currentWord
    ? state.selectedIndices.map((i) => currentWord.scrambled[i])
    : [];

  const revealedForCurrent =
    state.revealedPositions[state.currentWordIndex] ?? [];

  const handleHint = () => {
    handleFirstInteraction();
    useHint();
  };

  const handleSkip = () => {
    handleFirstInteraction();
    skipWord();
  };

  const handleSubmit = () => {
    submitWord();
  };

  const handleSelectLetter = (index: number) => {
    handleFirstInteraction();
    selectLetter(index);
  };

  const handleDeselectLetter = (answerPos: number) => {
    deselectLetter(answerPos);
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden">
      <GameBar
        difficulty={puzzle.difficulty}
        onPause={pause}
        onBack={handleNewTopic}
        gameStatus={state.gameStatus}
        title={puzzleTitle}
        onTitleChange={setPuzzleTitle}
        onStats={() => setShowStats(true)}
        onSave={handleSave}
        isSaved={isSaved || isSaving}
      />

      {/* Desktop layout */}
      <div className="hidden lg:flex flex-1 min-h-0 items-start justify-center pt-[18vh] pb-6">
        <div className="relative">
          {/* Instructions: positioned to the left */}
          <div className="absolute right-full top-0 mr-40 flex flex-col gap-2.5 text-white/45 text-xs font-body whitespace-nowrap">
            <div>
              <span className="text-[11px] uppercase tracking-[2px] text-white/50 font-heading font-semibold">
                How to Play
              </span>
              <div className="h-px bg-white/15 mt-2" />
            </div>
            <p>1. Tap scrambled letters to spell the word</p>
            <p>2. Tap answer slots to remove letters</p>
            <p>3. Wrong answers and skips cost 1 life</p>
            <p>4. Hints lock a letter in the right spot</p>
            <p>5. Unscramble all words to win</p>
          </div>

          {/* Hint: positioned to the right */}
          <div className="absolute left-full top-0 ml-38 flex flex-col items-center whitespace-nowrap">
            <div className="flex flex-col items-center gap-3">
              <div>
                <span className="text-[11px] uppercase tracking-[2px] text-white/50 font-heading font-semibold">
                  Hint
                </span>
                <div className="h-px bg-white/15 mt-2" />
              </div>
              <button
                onClick={handleHint}
                disabled={!canHint}
                className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(255, 215, 0, 0.15)",
                  border: "2px solid rgba(255, 215, 0, 0.4)",
                  boxShadow: "0 0 20px rgba(255, 215, 0, 0.15)",
                }}
                title="Reveal a letter (costs 1 life)"
              >
                <svg className="w-6 h-6 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </button>
              <span className="text-xs text-white/50 font-body">
                Costs 1 life
              </span>
            </div>
          </div>

          {/* Main game panel */}
          <div
            className="flex flex-col items-center gap-7 rounded-3xl p-10 min-w-[480px]"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Word progress */}
            <div className="text-[11px] uppercase tracking-[2px] text-white/55 font-heading font-semibold">
              Word {state.currentWordIndex + 1} of {puzzle.words.length}
            </div>

            {/* Clue */}
            {showClues && currentWord?.clue && (
              <p
                className="text-sm font-body text-center max-w-xs"
                style={{ color: "var(--white-muted)" }}
              >
                {currentWord.clue}
              </p>
            )}

            {/* Answer slots */}
            <div className="flex gap-2.5 justify-center flex-wrap">
              {currentWord &&
                Array.from({ length: currentWord.word.length }).map((_, i) => {
                  const letter = answerLetters[i] ?? null;
                  const isRevealed = revealedForCurrent.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (letter && !isRevealed) handleDeselectLetter(i);
                      }}
                      disabled={!letter || isRevealed}
                      className="w-14 h-14 rounded-xl flex items-center justify-center font-grid text-2xl font-bold uppercase transition-all"
                      style={{
                        background: letter
                          ? "rgba(255, 215, 0, 0.15)"
                          : "rgba(255, 255, 255, 0.03)",
                        border: isRevealed
                          ? "2px solid #FFD700"
                          : letter
                            ? "2px solid rgba(255, 215, 0, 0.4)"
                            : "2px dashed rgba(255, 255, 255, 0.15)",
                        color: letter ? "#FFD700" : "transparent",
                        cursor:
                          letter && !isRevealed ? "pointer" : "default",
                      }}
                    >
                      {letter ?? ""}
                    </button>
                  );
                })}
            </div>

            {/* Scrambled letter tiles */}
            <div className="flex gap-2.5 justify-center flex-wrap">
              {currentWord &&
                currentWord.scrambled.split("").map((letter, i) => {
                  const isSelected = state.selectedIndices.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!isSelected) handleSelectLetter(i);
                      }}
                      disabled={isSelected}
                      className="w-14 h-14 rounded-xl flex items-center justify-center font-grid text-2xl font-bold uppercase transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                      style={{
                        background: isSelected
                          ? "rgba(255, 255, 255, 0.02)"
                          : "rgba(255, 255, 255, 0.95)",
                        border: isSelected
                          ? "1px solid rgba(255, 255, 255, 0.05)"
                          : "1px solid rgba(255, 255, 255, 0.3)",
                        color: isSelected
                          ? "rgba(255, 255, 255, 0.15)"
                          : "#1a1a2e",
                        opacity: isSelected ? 0.3 : 1,
                        cursor: isSelected ? "default" : "pointer",
                      }}
                    >
                      {letter}
                    </button>
                  );
                })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 items-center">
              <button
                onClick={handleSkip}
                disabled={
                  state.gameStatus !== "playing" &&
                  state.gameStatus !== "idle"
                }
                className="px-5 py-2.5 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "var(--white-muted)",
                }}
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={!allSlotsFilled}
                className="px-7 py-2.5 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
                style={{
                  background: allSlotsFilled
                    ? "rgba(255, 215, 0, 0.2)"
                    : "rgba(255, 215, 0, 0.08)",
                  border: allSlotsFilled
                    ? "1px solid rgba(255, 215, 0, 0.5)"
                    : "1px solid rgba(255, 215, 0, 0.15)",
                  color: "#FFD700",
                }}
              >
                Submit
              </button>
            </div>
          </div>

          {/* Stats pill below panel */}
          <div className="flex justify-center mt-4">
            <GameStatsBar
              score={score}
              livesRemaining={state.livesRemaining}
              hintsUsed={state.hintsUsed}
              elapsedSeconds={state.elapsedSeconds}
              gameStatus={state.gameStatus}
              lastMissTimestamp={lastMissTimestamp}
            />
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden flex-1 flex flex-col items-center px-3 py-4 gap-4">
        {/* Word progress */}
        <div className="text-[11px] uppercase tracking-[2px] text-white/55 font-heading font-semibold">
          Word {state.currentWordIndex + 1} of {puzzle.words.length}
        </div>

        {/* Clue */}
        {showClues && currentWord?.clue && (
          <p
            className="text-sm font-body text-center max-w-xs"
            style={{ color: "var(--white-muted)" }}
          >
            {currentWord.clue}
          </p>
        )}

        {/* Answer slots */}
        <div className="flex gap-1.5 justify-center flex-wrap">
          {currentWord &&
            Array.from({ length: currentWord.word.length }).map((_, i) => {
              const letter = answerLetters[i] ?? null;
              const isRevealed = revealedForCurrent.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (letter && !isRevealed) handleDeselectLetter(i);
                  }}
                  disabled={!letter || isRevealed}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-grid text-base font-bold uppercase transition-all"
                  style={{
                    background: letter
                      ? "rgba(255, 215, 0, 0.15)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: isRevealed
                      ? "2px solid #FFD700"
                      : letter
                        ? "2px solid rgba(255, 215, 0, 0.4)"
                        : "2px dashed rgba(255, 255, 255, 0.15)",
                    color: letter ? "#FFD700" : "transparent",
                    cursor: letter && !isRevealed ? "pointer" : "default",
                  }}
                >
                  {letter ?? ""}
                </button>
              );
            })}
        </div>

        {/* Scrambled letter tiles */}
        <div className="flex gap-1.5 justify-center flex-wrap">
          {currentWord &&
            currentWord.scrambled.split("").map((letter, i) => {
              const isSelected = state.selectedIndices.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!isSelected) handleSelectLetter(i);
                  }}
                  disabled={isSelected}
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-grid text-base font-bold uppercase transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                  style={{
                    background: isSelected
                      ? "rgba(255, 255, 255, 0.02)"
                      : "rgba(255, 255, 255, 0.95)",
                    border: isSelected
                      ? "1px solid rgba(255, 255, 255, 0.05)"
                      : "1px solid rgba(255, 255, 255, 0.3)",
                    color: isSelected
                      ? "rgba(255, 255, 255, 0.15)"
                      : "#1a1a2e",
                    opacity: isSelected ? 0.3 : 1,
                    cursor: isSelected ? "default" : "pointer",
                  }}
                >
                  {letter}
                </button>
              );
            })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 items-center">
          <button
            onClick={handleSkip}
            disabled={
              state.gameStatus !== "playing" && state.gameStatus !== "idle"
            }
            className="px-4 py-2 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "var(--white-muted)",
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allSlotsFilled}
            className="px-6 py-2.5 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
            style={{
              background: allSlotsFilled
                ? "rgba(255, 215, 0, 0.2)"
                : "rgba(255, 215, 0, 0.08)",
              border: allSlotsFilled
                ? "1px solid rgba(255, 215, 0, 0.5)"
                : "1px solid rgba(255, 215, 0, 0.15)",
              color: "#FFD700",
            }}
          >
            Submit
          </button>
        </div>

        {/* Hint button (mobile) */}
        <button
          onClick={handleHint}
          disabled={!canHint}
          className="px-5 py-2 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
          style={{
            background: "rgba(255, 215, 0, 0.12)",
            border: "1px solid rgba(255, 215, 0, 0.3)",
            color: "#FFD700",
          }}
        >
          <span className="mr-1.5">
            <svg
              className="inline w-3.5 h-3.5 -mt-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </span>
          Hint
        </button>

        <GameStatsBar
          score={score}
          livesRemaining={state.livesRemaining}
          hintsUsed={state.hintsUsed}
          elapsedSeconds={state.elapsedSeconds}
          gameStatus={state.gameStatus}
          lastMissTimestamp={lastMissTimestamp}
        />
      </div>

      {/* Modals */}
      {state.gameStatus === "paused" && (
        <PauseMenu
          onResume={resume}
          onQuit={handleNewTopic}
        />
      )}

      {state.gameStatus === "lost" && (
        <GameOverModal
          wordsFound={state.solvedWords.length}
          wordsTotal={puzzle.words.length}
          elapsedSeconds={state.elapsedSeconds}
          onTryAgain={handlePlayAgain}
          onNewTopic={handleNewTopic}
          onSaveToLibrary={handleSave}
          isSavedToLibrary={isSaved}
        />
      )}

      {state.gameStatus === "won" && (
        <CompletionModal
          wordsFound={state.solvedWords.length}
          wordsTotal={puzzle.words.length}
          elapsedSeconds={state.elapsedSeconds}
          livesRemaining={state.livesRemaining}
          score={score}
          funFact={puzzle.funFact}
          onPlayAgain={handlePlayAgain}
          onNewTopic={handleNewTopic}
          onSaveToLibrary={handleSave}
          isSavedToLibrary={isSaved}
        />
      )}

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}

      {sessionExpired && <SessionExpiredModal />}

      {toastMessage && (
        <Toast
          message={toastMessage}
          icon={<Bookmark className="w-4 h-4 text-gold-primary" fill="currentColor" />}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
