"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GameBar } from "@/components/shared/GameBar";
import { GameStatsBar } from "@/components/shared/GameStatsBar";
import { PauseMenu } from "@/components/shared/PauseMenu";
import { GameDrawer } from "@/components/shared/GameDrawer";
import { GameOverModal } from "@/components/shared/GameOverModal";
import { CompletionModal } from "@/components/shared/CompletionModal";
import { StatsModal } from "@/components/shared/StatsModal";
import { useAnagramGame } from "@/hooks/useAnagramGame";
import { calculateScore } from "@/lib/scoring";
import { saveResult, savePuzzle } from "@/lib/storage";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Toast } from "@/components/shared/Toast";
import { SessionExpiredModal } from "@/components/shared/SessionExpiredModal";
import { WordSearchHeader } from "@/components/wordsearch/WordSearchHeader";
import { WordSearchStatsRow } from "@/components/wordsearch/WordSearchStatsRow";
import { WordProgress } from "@/components/wordsearch/WordProgress";
import { Bookmark } from "lucide-react";
import { ANAGRAM_DIFFICULTY_CONFIG } from "@/lib/types";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { AnagramPuzzleData } from "@/lib/types";

export default function AnagramPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<AnagramPuzzleData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.PUZZLE_ANAGRAM);
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setPuzzle(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_ANAGRAM);
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
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      saveResult({
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
      }).then((ok) => {
        if (!ok) setToastMessage("Couldn't save stats — check your connection");
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
    sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_ANAGRAM);
    sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    router.push("/");
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    window.location.reload();
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

  // Dynamic tile sizing for mobile
  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(375);

  useEffect(() => {
    const measure = () => {
      if (mobileContainerRef.current) {
        setContainerWidth(mobileContainerRef.current.clientWidth);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { mobileTileSize, mobileGap, mobileFontSize } = useMemo(() => {
    if (!currentWord) return { mobileTileSize: 44, mobileGap: 8, mobileFontSize: 18 };
    const wordLen = currentWord.word.length;
    const padding = 48; // px-5 each side + buffer
    const available = containerWidth - padding;

    // Try with 8px gap first
    let gap = 8;
    let size = Math.floor((available - (wordLen - 1) * gap) / wordLen);

    // If below 32px floor, reduce gap to 4px first
    if (size < 32) {
      gap = 4;
      size = Math.floor((available - (wordLen - 1) * gap) / wordLen);
    }

    size = Math.max(24, Math.min(44, size));

    // Font scales proportionally: 44px tile → 18px font
    const fontSize = Math.max(11, Math.round(size * (18 / 44)));

    return { mobileTileSize: size, mobileGap: gap, mobileFontSize: fontSize };
  }, [currentWord, containerWidth]);

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
      {/* Desktop: GameBar header */}
      <div className="hidden lg:block">
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
          onHint={handleHint}
          canHint={canHint}
          hintsUsed={state.hintsUsed}
        />
      </div>

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
            className="flex flex-col items-center gap-8 rounded-3xl p-10 min-w-[480px]"
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
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] uppercase tracking-[2px] text-white/40 font-heading font-semibold">Clue</span>
                <p
                  className="text-sm font-body text-center max-w-xs italic"
                  style={{ color: "var(--white-muted)" }}
                >
                  &ldquo;{currentWord.clue}&rdquo;
                </p>
              </div>
            )}

            {/* Answer slots — extra top margin for breathing room */}
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

      {/* ═══ Mobile: dark layout matching word search ═══ */}
      <div
        className="lg:hidden flex-1 flex flex-col"
        style={{ background: "var(--ws-bg)" }}
      >
        {/* Fixed header */}
        <WordSearchHeader
          title={puzzleTitle}
          onTitleChange={setPuzzleTitle}
          onBack={handleNewTopic}
          onHint={handleHint}
          canHint={canHint}
          hintsRemaining={Math.max(0, 3 - state.hintsUsed)}
          onMenu={() => setDrawerOpen(true)}
          gameStatus={state.gameStatus}
        />

        {/* Spacer for fixed header */}
        <div style={{ paddingTop: "calc(env(safe-area-inset-top, 40px) + 50px + 36px)" }} />

        {/* Stats row: hearts + score */}
        <WordSearchStatsRow
          livesRemaining={state.livesRemaining}
          score={score}
          lastMissTimestamp={lastMissTimestamp}
        />

        {/* Top-anchored play area */}
        <div
          ref={mobileContainerRef}
          className="flex-1 flex flex-col items-center px-5"
          style={{ paddingTop: 40, paddingBottom: "calc(env(safe-area-inset-bottom, 34px) + 12px)" }}
        >
          {/* Word count */}
          <div
            className="text-[11px] uppercase tracking-[2px] font-heading font-semibold"
            style={{ color: "rgba(255, 255, 255, 0.45)", marginBottom: 16 }}
          >
            Word {state.currentWordIndex + 1} of {puzzle.words.length}
          </div>

          {/* Clue — just italic text in quotes */}
          {showClues && currentWord?.clue && (
            <p
              className="font-body text-center max-w-xs italic"
              style={{
                fontSize: 15,
                color: "var(--ws-text-muted)",
                marginBottom: 20,
              }}
            >
              &ldquo;{currentWord.clue}&rdquo;
            </p>
          )}

          {/* Answer slots */}
          <div className="flex justify-center" style={{ gap: mobileGap }}>
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
                    className="flex items-center justify-center uppercase transition-all"
                    style={{
                      width: mobileTileSize,
                      height: mobileTileSize,
                      fontSize: mobileFontSize,
                      fontFamily: "var(--font-ws-mono)",
                      fontWeight: 700,
                      borderRadius: Math.max(6, Math.round(mobileTileSize * 0.18)),
                      background: letter
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(255, 255, 255, 0.03)",
                      border: isRevealed
                        ? "2px solid #f7c948"
                        : letter
                          ? "1px solid rgba(255, 255, 255, 0.18)"
                          : "1px solid rgba(255, 255, 255, 0.12)",
                      color: isRevealed
                        ? "#f7c948"
                        : letter
                          ? "rgba(255, 255, 255, 0.9)"
                          : "transparent",
                      cursor: letter && !isRevealed ? "pointer" : "default",
                    }}
                  >
                    {letter ?? ""}
                  </button>
                );
              })}
          </div>

          {/* Scrambled letter tiles */}
          <div className="flex justify-center" style={{ marginTop: 16, gap: mobileGap }}>
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
                    className="flex items-center justify-center uppercase transition-all active:scale-[0.97]"
                    style={{
                      width: mobileTileSize,
                      height: mobileTileSize,
                      fontSize: mobileFontSize,
                      fontFamily: "var(--font-ws-mono)",
                      fontWeight: 700,
                      borderRadius: Math.max(6, Math.round(mobileTileSize * 0.18)),
                      background: isSelected
                        ? "rgba(255, 255, 255, 0.02)"
                        : "rgba(255, 255, 255, 0.08)",
                      border: isSelected
                        ? "1px solid rgba(255, 255, 255, 0.04)"
                        : "1px solid rgba(255, 255, 255, 0.12)",
                      color: isSelected
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(255, 255, 255, 0.9)",
                      opacity: isSelected ? 0.3 : 1,
                      cursor: isSelected ? "default" : "pointer",
                    }}
                  >
                    {letter}
                  </button>
                );
              })}
          </div>

          {/* Skip / Submit buttons */}
          <div className="flex items-center w-full" style={{ marginTop: 24, gap: 10, maxWidth: 280 }}>
            <button
              onClick={handleSkip}
              disabled={
                state.gameStatus !== "playing" && state.gameStatus !== "idle"
              }
              className="flex-1 py-3 font-heading text-[13px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                borderRadius: 14,
                color: "var(--ws-text-muted)",
              }}
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={!allSlotsFilled}
              className="flex-1 py-3 font-heading text-[13px] font-bold uppercase tracking-wider transition-all active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
              style={{
                background: allSlotsFilled
                  ? "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)"
                  : "rgba(255, 215, 0, 0.08)",
                border: allSlotsFilled
                  ? "none"
                  : "1px solid rgba(255, 215, 0, 0.12)",
                borderRadius: 14,
                color: allSlotsFilled ? "#1a0a2e" : "rgba(255, 215, 0, 0.4)",
                boxShadow: allSlotsFilled
                  ? "0 4px 15px rgba(255, 215, 0, 0.4)"
                  : "none",
              }}
            >
              Submit
            </button>
          </div>

          {/* Progress bar — quiet footer below buttons */}
          <div style={{ marginTop: 32, width: "100%", maxWidth: 280 }}>
            <WordProgress
              found={state.solvedWords.length}
              total={puzzle.words.length}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {state.gameStatus === "paused" && (
        <PauseMenu
          onResume={resume}
          onQuit={handleNewTopic}
          gameType="anagram"
        />
      )}

      <GameDrawer
        gameType="anagram"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStats={() => { setDrawerOpen(false); setShowStats(true); }}
        onShare={() => {
          const msg = `I'm playing Anagram on Lexicon!\nTopic: ${puzzleTitle}\nDifficulty: ${puzzle.difficulty}`;
          navigator.clipboard.writeText(msg).then(() => {
            setToastMessage("Copied to clipboard!");
          });
        }}
        onSettings={() => { setDrawerOpen(false); setToastMessage("Coming soon"); }}
      />

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
