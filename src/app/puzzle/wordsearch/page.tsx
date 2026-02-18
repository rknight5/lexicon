"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PuzzleGrid } from "@/components/wordsearch/PuzzleGrid";
import { WordProgress } from "@/components/wordsearch/WordProgress";
import { WordList } from "@/components/wordsearch/WordList";
import { WordSearchHeader } from "@/components/wordsearch/WordSearchHeader";
import { WordSearchStatsRow } from "@/components/wordsearch/WordSearchStatsRow";
import { WordSearchGameOver } from "@/components/wordsearch/WordSearchGameOver";
import { WordSearchCompletion } from "@/components/wordsearch/WordSearchCompletion";
import { GameBar } from "@/components/shared/GameBar";
import { GameStatsBar } from "@/components/shared/GameStatsBar";
import { PauseMenu } from "@/components/shared/PauseMenu";
import { GameDrawer } from "@/components/shared/GameDrawer";
import { GameOverModal } from "@/components/shared/GameOverModal";
import { CompletionModal } from "@/components/shared/CompletionModal";
import { StatsModal } from "@/components/shared/StatsModal";
import { useWordSearchGame } from "@/hooks/useWordSearchGame";
import { calculateScore } from "@/lib/scoring";
import { saveResult, savePuzzle } from "@/lib/storage";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Toast } from "@/components/shared/Toast";
import { SessionExpiredModal } from "@/components/shared/SessionExpiredModal";
import { Bookmark } from "lucide-react";
import { ShareSheet } from "@/components/shared/ShareSheet";
import { generateShareCard, type ShareCardData } from "@/lib/share";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { PuzzleData } from "@/lib/types";

export default function WordSearchPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.PUZZLE_WORDSEARCH);
    if (!stored) {
      sessionStorage.setItem(STORAGE_KEYS.REDIRECT_REASON, "No puzzle data found. Generate a new puzzle to play.");
      router.push("/");
      return;
    }
    try {
      setPuzzle(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_WORDSEARCH);
      sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      sessionStorage.setItem(STORAGE_KEYS.REDIRECT_REASON, "Puzzle data was corrupted. Generate a new puzzle.");
      router.push("/");
    }
  }, [router]);

  if (!puzzle) return null;

  return <WordSearchGame puzzle={puzzle} />;
}

function WordSearchGame({ puzzle: initialPuzzle }: { puzzle: PuzzleData }) {
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
    startSelection,
    setSelection,
    completeSelection,
    cancelSelection,
    useHint,
    restoreGame,
  } = useWordSearchGame(puzzle);

  const getGameState = useCallback(() => {
    return { ...state } as unknown as Record<string, unknown>;
  }, [state]);

  useAutoSave({
    gameType: "wordsearch",
    title: puzzleTitle,
    difficulty: puzzle.difficulty,
    puzzleData: puzzle,
    gameStatus: state.gameStatus,
    getGameState,
    onSessionExpired: () => setSessionExpired(true),
    onSaveFailed: () => setToastMessage("Auto-save failed — check your connection"),
  });

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

  const [lastMissTimestamp, setLastMissTimestamp] = useState(0);
  const [lastFoundTimestamp, setLastFoundTimestamp] = useState(0);
  const prevLives = useRef(state.livesRemaining);
  const prevFoundCount = useRef(state.foundWords.length);

  useEffect(() => {
    if (state.livesRemaining < prevLives.current) {
      setLastMissTimestamp(Date.now());
    }
    prevLives.current = state.livesRemaining;
  }, [state.livesRemaining]);

  useEffect(() => {
    if (state.foundWords.length > prevFoundCount.current) {
      setLastFoundTimestamp(Date.now());
    }
    prevFoundCount.current = state.foundWords.length;
  }, [state.foundWords.length]);

  // Save result when game ends
  const savedRef = useRef(false);
  useEffect(() => {
    if ((state.gameStatus === "won" || state.gameStatus === "lost") && !savedRef.current) {
      savedRef.current = true;
      saveResult({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: puzzle.title,
        gameType: "wordsearch",
        difficulty: puzzle.difficulty,
        score: calculateScore(state.foundWords.length, state.livesRemaining, puzzle.difficulty),
        wordsFound: state.foundWords.length,
        wordsTotal: puzzle.words.length,
        elapsedSeconds: state.elapsedSeconds,
        livesRemaining: state.livesRemaining,
        hintsUsed: state.hintsUsed,
        outcome: state.gameStatus,
      }).then((ok) => {
        if (!ok) setToastMessage("Couldn't save stats — check your connection");
      });
    }
  }, [state.gameStatus, state.foundWords.length, state.livesRemaining, state.elapsedSeconds, state.hintsUsed, puzzle]);

  // Start game on first grid interaction
  const handleFirstInteraction = () => {
    if (state.gameStatus === "idle") {
      startGame();
    }
  };

  const handleHome = () => router.push("/");

  const handleNewTopic = () => {
    sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_WORDSEARCH);
    sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    sessionStorage.setItem(STORAGE_KEYS.SHOW_CONFIG, puzzleTitle);
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
      const result = await savePuzzle("wordsearch", puzzle.title, puzzle.difficulty, puzzle);
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
    state.foundWords.length,
    state.livesRemaining,
    puzzle.difficulty
  );

  const handleRandomHint = () => {
    handleFirstInteraction();
    const unfound = puzzle.words
      .map((w) => w.word)
      .filter((w) => !state.foundWords.includes(w) && !state.hintedWords[w]);
    if (unfound.length === 0) return;
    const pick = unfound[Math.floor(Math.random() * unfound.length)];
    useHint(pick);
  };

  const canHint = (state.gameStatus === "playing" || state.gameStatus === "idle") && state.livesRemaining > 1 &&
    puzzle.words.some((w) => !state.foundWords.includes(w.word) && !state.hintedWords[w.word]);

  const hintsRemaining = 3 - state.hintsUsed;

  const missedWords = puzzle.words.filter((w) => !state.foundWords.includes(w.word));

  const [showShareSheet, setShowShareSheet] = useState(false);
  const shareData: ShareCardData = {
    gameType: "wordsearch",
    topic: puzzleTitle,
    difficulty: puzzle.difficulty,
    wordsFound: state.foundWords.length,
    wordsTotal: puzzle.words.length,
    livesRemaining: state.livesRemaining,
    score,
  };
  const handleShare = () => setShowShareSheet(true);

  return (
    <div className="min-h-screen lg:h-screen flex flex-col lg:overflow-hidden">
      {/* Desktop: GameBar header */}
      <div className="hidden lg:block">
        <GameBar
          difficulty={puzzle.difficulty}
          onPause={pause}
          onBack={handleHome}
          gameStatus={state.gameStatus}
          title={puzzleTitle}
          onTitleChange={setPuzzleTitle}
          onStats={() => setShowStats(true)}
          onSave={handleSave}
          isSaved={isSaved || isSaving}
          onHint={handleRandomHint}
          canHint={canHint}
          hintsUsed={state.hintsUsed}
          onMenu={() => setDrawerOpen(true)}
        />
      </div>

      {/* Desktop: unified game panel */}
      <div className="hidden lg:flex flex-1 min-h-0 items-center justify-center pt-0 pb-6">
        <div className="relative">
          {/* Instructions: positioned to the left of the panel, top-aligned */}
          <div
            className="absolute right-full top-0 mr-23 flex flex-col gap-2.5 whitespace-nowrap"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <span className="font-ws-mono text-[11px] uppercase tracking-[2px] text-white/50 font-semibold">How to Play</span>
            <div className="flex flex-col gap-2 text-white/45 text-xs font-ws-body">
              <p>1. Drag across letters to form words</p>
              <p>2. Words can go in any direction</p>
              <p>3. Wrong words cost 1 life</p>
              <p>4. Hints reveal a word&apos;s direction</p>
              <p>5. Find all words to win</p>
            </div>
          </div>

          {/* Hint: positioned to the right of the panel, top-aligned, mirroring How to Play */}
          <div className="absolute left-full top-0 ml-38 flex flex-col items-center whitespace-nowrap">
            <div className="flex flex-col items-center gap-3">
              <div>
                <span className="text-[11px] uppercase tracking-[2px] text-white/50 font-heading font-semibold">Hint</span>
                <div className="h-px bg-white/15 mt-2" />
              </div>
              <button
                onClick={handleRandomHint}
                disabled={!canHint}
                className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(255, 215, 0, 0.15)",
                  border: "2px solid rgba(255, 215, 0, 0.4)",
                  boxShadow: "0 0 20px rgba(255, 215, 0, 0.15)",
                }}
                title="Get a random hint (costs 1 life)"
              >
                <svg className="w-6 h-6 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </button>
              <span className="text-xs text-white/50 font-body">Costs 1 life</span>
            </div>
          </div>

          <div
            className="flex rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Grid */}
            <div className="p-5 flex items-center">
              <PuzzleGrid
                grid={puzzle.grid}
                gridSize={puzzle.gridSize}
                gridCols={puzzle.gridCols}
                gridRows={puzzle.gridRows}
                selectedCells={state.selectedCells}
                foundPaths={state.foundPaths}
                gameStatus={state.gameStatus}
                onCellPointerDown={(cell) => {
                  handleFirstInteraction();
                  startSelection(cell);
                }}
                onSelectionChange={setSelection}
                onPointerUp={completeSelection}
                onPointerLeave={cancelSelection}
                lastMissTimestamp={lastMissTimestamp}
                lastFoundTimestamp={lastFoundTimestamp}
                variant="desktop"
              />
            </div>

            {/* Word list to the right of grid */}
            <div className="py-5 pr-8 pl-3 flex flex-col gap-4" style={{ minWidth: 240 }}>
              <WordProgress
                found={state.foundWords.length}
                total={puzzle.words.length}
              />
              <div
                className="overflow-y-auto ws-pills-scroll"
                style={{ maxHeight: 360 }}
              >
                <WordList
                  words={puzzle.words}
                  foundWords={state.foundWords}
                  hintedWords={state.hintedWords}
                />
              </div>
            </div>
          </div>

          {/* Spacer for fixed bottom stats bar */}
          <div style={{ height: 60 }} />
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

      {/* ═══ Mobile: redesigned layout ═══ */}
      <div
        className="lg:hidden flex-1 flex flex-col"
        style={{ background: "var(--ws-bg)" }}
      >
        {/* Fixed header */}
        <WordSearchHeader
          title={puzzleTitle}
          onTitleChange={setPuzzleTitle}
          onBack={handleHome}
          onHint={handleRandomHint}
          canHint={canHint}
          hintsRemaining={Math.max(0, hintsRemaining)}
          onMenu={() => setDrawerOpen(true)}
          gameStatus={state.gameStatus}
        />

        {/* Spacer for fixed header + 36px gap */}
        <div style={{ paddingTop: "calc(env(safe-area-inset-top, 40px) + 50px + 36px)" }} />

        {/* Stats row: hearts + score */}
        <WordSearchStatsRow
          livesRemaining={state.livesRemaining}
          score={score}
          lastMissTimestamp={lastMissTimestamp}
        />

        {/* Grid — fixed zone */}
        <div style={{ padding: "4px 4px" }}>
          <div className="w-full flex justify-center">
            <PuzzleGrid
              grid={puzzle.grid}
              gridSize={puzzle.gridSize}
              gridCols={puzzle.gridCols}
              gridRows={puzzle.gridRows}
              selectedCells={state.selectedCells}
              foundPaths={state.foundPaths}
              gameStatus={state.gameStatus}
              onCellPointerDown={(cell) => {
                handleFirstInteraction();
                startSelection(cell);
              }}
              onSelectionChange={setSelection}
              onPointerUp={completeSelection}
              onPointerLeave={cancelSelection}
              lastMissTimestamp={lastMissTimestamp}
              lastFoundTimestamp={lastFoundTimestamp}
              variant="mobile"
            />
          </div>
        </div>

        {/* Progress bar — clean divider between grid and pills */}
        <div style={{ padding: "4px 18px 10px" }}>
          <WordProgress
            found={state.foundWords.length}
            total={puzzle.words.length}
          />
        </div>

        {/* Word pills — independently scrollable zone */}
        <div
          className="flex-1 overflow-y-auto ws-pills-scroll"
          style={{
            padding: "0 18px 12px",
            paddingBottom: "calc(env(safe-area-inset-bottom, 34px) + 12px)",
          }}
        >
          <WordList
            words={puzzle.words}
            foundWords={state.foundWords}
            hintedWords={state.hintedWords}
          />
        </div>
      </div>

      {/* ═══ Modals ═══ */}
      {state.gameStatus === "paused" && (
        <PauseMenu
          onResume={resume}
          onQuit={handleNewTopic}
          gameType="wordsearch"
          shareData={shareData}
          onToast={setToastMessage}
        />
      )}

      <GameDrawer
        gameType="wordsearch"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNewPuzzle={handleNewTopic}
        onStats={() => { setDrawerOpen(false); setShowStats(true); }}
        onShare={handleShare}
        onSettings={() => { setDrawerOpen(false); setToastMessage("Coming soon"); }}
      />

      {/* Mobile game over */}
      {state.gameStatus === "lost" && (
        <>
          <div className="lg:hidden">
            <WordSearchGameOver
              wordsFound={state.foundWords.length}
              wordsTotal={puzzle.words.length}
              missedWords={missedWords}
              elapsedSeconds={state.elapsedSeconds}
              score={score}
              onTryAgain={handlePlayAgain}
              onChangeTopic={handleNewTopic}
              onHome={handleNewTopic}
              onShare={handleShare}
              onSaveToLibrary={handleSave}
              isSavedToLibrary={isSaved}
            />
          </div>
          <div className="hidden lg:block">
            <GameOverModal
              wordsFound={state.foundWords.length}
              wordsTotal={puzzle.words.length}
              elapsedSeconds={state.elapsedSeconds}
              onTryAgain={handlePlayAgain}
              onNewTopic={handleNewTopic}
              onShare={handleShare}
              onSaveToLibrary={handleSave}
              isSavedToLibrary={isSaved}
            />
          </div>
        </>
      )}

      {/* Mobile completion */}
      {state.gameStatus === "won" && (
        <>
          <div className="lg:hidden">
            <WordSearchCompletion
              wordsFound={state.foundWords.length}
              wordsTotal={puzzle.words.length}
              elapsedSeconds={state.elapsedSeconds}
              livesRemaining={state.livesRemaining}
              score={score}
              funFact={puzzle.funFact}
              onPlayAgain={handlePlayAgain}
              onChangeTopic={handleNewTopic}
              onHome={handleNewTopic}
              onShare={handleShare}
              onSaveToLibrary={handleSave}
              isSavedToLibrary={isSaved}
            />
          </div>
          <div className="hidden lg:block">
            <CompletionModal
              wordsFound={state.foundWords.length}
              wordsTotal={puzzle.words.length}
              elapsedSeconds={state.elapsedSeconds}
              livesRemaining={state.livesRemaining}
              score={score}
              funFact={puzzle.funFact}
              onPlayAgain={handlePlayAgain}
              onNewTopic={handleNewTopic}
              onShare={handleShare}
              onSaveToLibrary={handleSave}
              isSavedToLibrary={isSaved}
            />
          </div>
        </>
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
