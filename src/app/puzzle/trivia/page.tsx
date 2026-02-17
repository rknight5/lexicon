"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Home, Heart, Bookmark } from "lucide-react";
import { CountdownTimer } from "@/components/trivia/CountdownTimer";
import { PauseMenu } from "@/components/shared/PauseMenu";
import { GameDrawer } from "@/components/shared/GameDrawer";
import { GameOverModal } from "@/components/shared/GameOverModal";
import { CompletionModal } from "@/components/shared/CompletionModal";
import { StatsModal } from "@/components/shared/StatsModal";
import { Toast } from "@/components/shared/Toast";
import { SessionExpiredModal } from "@/components/shared/SessionExpiredModal";
import { ShareSheet } from "@/components/shared/ShareSheet";
import { generateShareCard, type ShareCardData } from "@/lib/share";
import { useTriviaGame } from "@/hooks/useTriviaGame";
import { useAutoSave } from "@/hooks/useAutoSave";
import { saveResult, savePuzzle } from "@/lib/storage";
import { STORAGE_KEYS, puzzleKeyForGameType } from "@/lib/storage-keys";
import type { TriviaPuzzleData } from "@/lib/types";

export default function TriviaPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<TriviaPuzzleData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(puzzleKeyForGameType("trivia"));
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setPuzzle(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem(puzzleKeyForGameType("trivia"));
      router.push("/");
    }
  }, [router]);

  if (!puzzle) return null;

  return <TriviaGame puzzle={puzzle} />;
}

function TriviaGame({ puzzle }: { puzzle: TriviaPuzzleData }) {
  const router = useRouter();
  const [puzzleTitle, setPuzzleTitle] = useState(puzzle.title);
  const [showStats, setShowStats] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Feedback state
  const [feedbackIndex, setFeedbackIndex] = useState<number | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<"correct" | "wrong" | "skipped" | null>(null);

  const {
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
  } = useTriviaGame(puzzle);

  // Auto-save
  const getGameState = useCallback(() => {
    return { ...state } as unknown as Record<string, unknown>;
  }, [state]);

  useAutoSave({
    gameType: "trivia",
    title: puzzleTitle,
    difficulty: puzzle.difficulty,
    puzzleData: puzzle,
    gameStatus: state.gameStatus,
    getGameState,
    onSessionExpired: () => setSessionExpired(true),
  });

  // Restore saved game state
  useEffect(() => {
    const savedState = sessionStorage.getItem(STORAGE_KEYS.GAME_STATE);
    if (savedState) {
      try {
        restoreGame(JSON.parse(savedState));
      } catch {
        console.error("Failed to restore game state — starting fresh");
      }
      sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    }
  }, [restoreGame]);

  // Start game on mount (auto-start since there's no grid interaction to trigger it)
  useEffect(() => {
    if (state.gameStatus === "idle") {
      startGame();
    }
  }, [state.gameStatus, startGame]);

  // Save result when game ends
  const savedRef = useRef(false);
  useEffect(() => {
    if ((state.gameStatus === "won" || state.gameStatus === "lost") && !savedRef.current) {
      savedRef.current = true;
      const correctCount = state.answers.filter((a) => a === "correct").length;
      saveResult({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: puzzle.title,
        gameType: "trivia",
        difficulty: puzzle.difficulty,
        score: state.score,
        wordsFound: correctCount,
        wordsTotal: puzzle.questions.length,
        elapsedSeconds: state.elapsedSeconds,
        livesRemaining: state.livesRemaining,
        hintsUsed: state.hintsUsed,
        outcome: state.gameStatus,
      }).then((ok) => {
        if (!ok) setToastMessage("Couldn't save stats — check your connection");
      });
    }
  }, [state.gameStatus, state.answers, state.score, state.elapsedSeconds, state.livesRemaining, state.hintsUsed, puzzle]);

  // Handle answer selection — show feedback, wait for player to tap Next
  const handleAnswer = useCallback((index: number) => {
    if (state.gameStatus !== "playing") return;
    if (state.answers.length > state.currentIndex) return; // already answered

    const question = puzzle.questions[state.currentIndex];
    const isCorrect = index === question.correctIndex;

    selectAnswer(index, timeRemaining);
    setFeedbackIndex(index);
    setFeedbackResult(isCorrect ? "correct" : "wrong");
  }, [state.gameStatus, state.currentIndex, state.answers.length, puzzle.questions, selectAnswer, timeRemaining]);

  // Handle time up feedback — show result, wait for player to tap Next
  const prevAnswersLenRef = useRef(state.answers.length);
  useEffect(() => {
    if (state.answers.length > prevAnswersLenRef.current) {
      prevAnswersLenRef.current = state.answers.length;
      if (state.answers[state.answers.length - 1] === "skipped") {
        setFeedbackResult("skipped");
      }
    }
  }, [state.answers]);

  const handleNext = () => {
    setFeedbackIndex(null);
    setFeedbackResult(null);
    nextQuestion();
  };

  const handleNewTopic = () => {
    sessionStorage.removeItem(puzzleKeyForGameType("trivia"));
    sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    sessionStorage.setItem(STORAGE_KEYS.SHOW_CONFIG, puzzleTitle);
    router.push("/");
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    window.location.reload();
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await savePuzzle("trivia", puzzle.title, puzzle.difficulty, puzzle);
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

  const correctCount = state.answers.filter((a) => a === "correct").length;
  const canHint =
    state.gameStatus === "playing" &&
    state.hintsUsed < 3 &&
    state.answers.length <= state.currentIndex &&
    puzzle.questions[state.currentIndex]?.type === "mc";

  const shareData: ShareCardData = {
    gameType: "trivia",
    topic: puzzleTitle,
    difficulty: puzzle.difficulty,
    wordsFound: correctCount,
    wordsTotal: puzzle.questions.length,
    livesRemaining: state.livesRemaining,
    score: state.score,
  };
  const handleShare = () => setShowShareSheet(true);

  const currentQuestion = puzzle.questions[state.currentIndex];
  const hasAnswered = state.answers.length > state.currentIndex;
  const eliminated = state.eliminatedOptions[state.currentIndex] ?? [];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--ws-bg)" }}
    >
      {/* Fixed header */}
      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          background: "var(--ws-header-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          paddingTop: "env(safe-area-inset-top, 40px)",
          paddingBottom: "2px",
        }}
      >
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: "80px 1fr 80px",
            padding: "6px 14px",
          }}
        >
          {/* Left — Home */}
          <div className="flex justify-start">
            <button
              onClick={handleNewTopic}
              className="flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:scale-95"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.08)",
              }}
            >
              <Home style={{ width: 19, height: 19, color: "rgba(255, 255, 255, 0.7)" }} />
            </button>
          </div>

          {/* Center — Title */}
          <div className="flex items-center justify-center min-w-0">
            <span
              className="text-white truncate"
              style={{
                fontFamily: "var(--font-ws-body)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {puzzleTitle}
            </span>
          </div>

          {/* Right — Hint + Menu */}
          <div className="flex items-center justify-end gap-2">
            {/* Hint button */}
            <button
              onClick={useHint}
              disabled={!canHint}
              className="relative flex items-center justify-center cursor-pointer transition-opacity disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(247, 201, 72, 0.12)",
                border: "1px solid rgba(247, 201, 72, 0.18)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f7c948" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {(3 - state.hintsUsed) > 0 && (
                <span
                  className="absolute flex items-center justify-center"
                  style={{
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#f7c948",
                    color: "#1a1430",
                    fontSize: 9,
                    fontWeight: 700,
                    fontFamily: "var(--font-ws-mono)",
                  }}
                >
                  {3 - state.hintsUsed}
                </span>
              )}
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-center cursor-pointer transition-opacity active:scale-95"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.08)",
              }}
            >
              <div className="flex flex-col items-center justify-center" style={{ gap: "3.5px" }}>
                <span style={{ width: 16, height: 1.5, background: "rgba(255, 255, 255, 0.5)", borderRadius: 1 }} />
                <span style={{ width: 16, height: 1.5, background: "rgba(255, 255, 255, 0.5)", borderRadius: 1 }} />
                <span style={{ width: 16, height: 1.5, background: "rgba(255, 255, 255, 0.5)", borderRadius: 1 }} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div style={{ paddingTop: "calc(env(safe-area-inset-top, 40px) + 50px + 16px)" }} />

      {/* Stats row: hearts + score + question counter */}
      <div className="flex items-center justify-between px-5 py-2">
        {/* Hearts */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className="w-4 h-4"
              style={{
                color: i < state.livesRemaining ? "#FF6B8A" : "rgba(255, 255, 255, 0.15)",
              }}
              fill={i < state.livesRemaining ? "currentColor" : "none"}
            />
          ))}
        </div>

        {/* Question counter */}
        <span className="font-heading text-xs font-semibold" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
          Q {state.currentIndex + 1}/{puzzle.questions.length}
        </span>

        {/* Score */}
        <span className="font-grid text-sm font-bold" style={{ color: "#FFD700" }}>
          {state.score}
        </span>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center px-5 pb-5" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 34px) + 20px)" }}>
        {currentQuestion && state.gameStatus === "playing" && (
          <>
            {/* Countdown Timer */}
            <div className="py-4">
              <CountdownTimer
                timeRemaining={timeRemaining}
                timeTotal={timeTotal}
                running={state.timerRunning}
                size={80}
              />
            </div>

            {/* Question text */}
            <div className="w-full max-w-md text-center mb-6">
              <p
                className="font-body text-lg font-semibold leading-relaxed"
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
              >
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer area */}
            {currentQuestion.type === "mc" ? (
              <div className="w-full max-w-md space-y-3">
                {currentQuestion.options.map((option, i) => {
                  const isEliminated = eliminated.includes(i);
                  const isSelected = feedbackIndex === i;
                  const isCorrectOption = i === currentQuestion.correctIndex;
                  const showCorrect = hasAnswered && isCorrectOption;
                  const showWrong = isSelected && feedbackResult === "wrong";

                  let bg = "rgba(255, 255, 255, 0.06)";
                  let border = "1px solid rgba(167, 139, 250, 0.15)";
                  let animClass = "";

                  if (showCorrect) {
                    bg = "rgba(52, 211, 153, 0.2)";
                    border = "1px solid rgba(52, 211, 153, 0.4)";
                    animClass = "animate-answer-correct";
                  } else if (showWrong) {
                    bg = "rgba(255, 107, 138, 0.2)";
                    border = "1px solid rgba(255, 107, 138, 0.4)";
                    animClass = "animate-answer-wrong";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => !hasAnswered && !isEliminated && handleAnswer(i)}
                      disabled={hasAnswered || isEliminated}
                      className={`w-full flex items-center px-4 rounded-xl font-body text-sm font-medium transition-all ${animClass}`}
                      style={{
                        minHeight: 52,
                        background: bg,
                        border,
                        color: isEliminated
                          ? "rgba(255, 255, 255, 0.2)"
                          : "rgba(255, 255, 255, 0.85)",
                        opacity: isEliminated ? 0.3 : 1,
                        textDecoration: isEliminated ? "line-through" : "none",
                        cursor: hasAnswered || isEliminated ? "default" : "pointer",
                      }}
                    >
                      <span
                        className="flex-shrink-0 flex items-center justify-center mr-3 font-heading text-xs font-bold"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 8,
                          background: "rgba(255, 255, 255, 0.08)",
                          color: "rgba(255, 255, 255, 0.5)",
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* True/False buttons */
              <div className="w-full max-w-md flex gap-3">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = feedbackIndex === i;
                  const isCorrectOption = i === currentQuestion.correctIndex;
                  const showCorrect = hasAnswered && isCorrectOption;
                  const showWrong = isSelected && feedbackResult === "wrong";

                  let bg = "rgba(255, 255, 255, 0.06)";
                  let border = "1px solid rgba(167, 139, 250, 0.15)";
                  let animClass = "";

                  if (showCorrect) {
                    bg = "rgba(52, 211, 153, 0.2)";
                    border = "1px solid rgba(52, 211, 153, 0.4)";
                    animClass = "animate-answer-correct";
                  } else if (showWrong) {
                    bg = "rgba(255, 107, 138, 0.2)";
                    border = "1px solid rgba(255, 107, 138, 0.4)";
                    animClass = "animate-answer-wrong";
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => !hasAnswered && handleAnswer(i)}
                      disabled={hasAnswered}
                      className={`flex-1 flex items-center justify-center rounded-xl font-heading text-sm font-bold uppercase tracking-wider transition-all ${animClass}`}
                      style={{
                        minHeight: 56,
                        background: bg,
                        border,
                        color: "rgba(255, 255, 255, 0.85)",
                        cursor: hasAnswered ? "default" : "pointer",
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full max-w-md mt-6">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-body text-[11px]" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                  {state.answers.filter((a) => a === "correct").length}/{puzzle.questions.length} correct
                </span>
                <span className="font-body text-[11px]" style={{ color: "rgba(255, 255, 255, 0.4)" }}>
                  Q{state.currentIndex + 1} of {puzzle.questions.length}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: "rgba(255, 255, 255, 0.08)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${((state.currentIndex + (hasAnswered ? 1 : 0)) / puzzle.questions.length) * 100}%`,
                    borderRadius: 2,
                    background: "linear-gradient(90deg, #a78bfa, #c084fc)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Feedback message + Next button */}
            {hasAnswered && (
              <div className="w-full max-w-md mt-5 flex flex-col items-center gap-3">
                {feedbackResult === "correct" && (
                  <span className="font-heading text-sm font-bold" style={{ color: "#34D399" }}>
                    Correct!
                  </span>
                )}
                {feedbackResult === "wrong" && (
                  <span className="font-heading text-sm font-bold" style={{ color: "#FF6B8A" }}>
                    Wrong! The answer was: {currentQuestion.options[currentQuestion.correctIndex]}
                  </span>
                )}
                {feedbackResult === "skipped" && (
                  <span className="font-heading text-sm font-bold" style={{ color: "rgba(255, 255, 255, 0.5)" }}>
                    Time&apos;s up! The answer was: {currentQuestion.options[currentQuestion.correctIndex]}
                  </span>
                )}
                <button
                  onClick={handleNext}
                  className="px-8 h-10 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
                  style={{
                    background: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {state.gameStatus === "paused" && (
        <PauseMenu
          onResume={resume}
          onQuit={handleNewTopic}
          gameType="trivia"
          shareData={shareData}
          onToast={setToastMessage}
        />
      )}

      <GameDrawer
        gameType="trivia"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStats={() => { setDrawerOpen(false); setShowStats(true); }}
        onShare={handleShare}
        onSettings={() => { setDrawerOpen(false); setToastMessage("Coming soon"); }}
      />

      {state.gameStatus === "lost" && (
        <GameOverModal
          wordsFound={correctCount}
          wordsTotal={puzzle.questions.length}
          elapsedSeconds={state.elapsedSeconds}
          onTryAgain={handlePlayAgain}
          onNewTopic={handleNewTopic}
          onShare={handleShare}
          onSaveToLibrary={handleSave}
          isSavedToLibrary={isSaved}
        />
      )}

      {state.gameStatus === "won" && (
        <CompletionModal
          wordsFound={correctCount}
          wordsTotal={puzzle.questions.length}
          elapsedSeconds={state.elapsedSeconds}
          livesRemaining={state.livesRemaining}
          score={state.score}
          funFact={puzzle.funFact}
          onPlayAgain={handlePlayAgain}
          onNewTopic={handleNewTopic}
          onShare={handleShare}
          onSaveToLibrary={handleSave}
          isSavedToLibrary={isSaved}
        />
      )}

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      {sessionExpired && <SessionExpiredModal />}

      {showShareSheet && (
        <ShareSheet
          text={generateShareCard(shareData)}
          onClose={() => setShowShareSheet(false)}
          onToast={(msg) => { setToastMessage(msg); setShowShareSheet(false); }}
        />
      )}

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
