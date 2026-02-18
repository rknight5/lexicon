"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CrosswordGrid } from "@/components/crossword/CrosswordGrid";
import { ClueList } from "@/components/crossword/ClueList";
import { GameBar } from "@/components/shared/GameBar";
import { GameStatsBar } from "@/components/shared/GameStatsBar";
import { PauseMenu } from "@/components/shared/PauseMenu";
import { GameDrawer } from "@/components/shared/GameDrawer";
import { GameOverModal } from "@/components/shared/GameOverModal";
import { CompletionModal } from "@/components/shared/CompletionModal";
import { StatsModal } from "@/components/shared/StatsModal";
import { useCrosswordGame } from "@/hooks/useCrosswordGame";
import { calculateScore } from "@/lib/scoring";
import { saveResult, savePuzzle } from "@/lib/storage";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Toast } from "@/components/shared/Toast";
import { SessionExpiredModal } from "@/components/shared/SessionExpiredModal";
import { WordSearchHeader } from "@/components/wordsearch/WordSearchHeader";
import { WordSearchStatsRow } from "@/components/wordsearch/WordSearchStatsRow";
import { WordProgress } from "@/components/wordsearch/WordProgress";
import { Bookmark } from "lucide-react";
import { ShareSheet } from "@/components/shared/ShareSheet";
import { generateShareCard, type ShareCardData } from "@/lib/share";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import type { CrosswordPuzzleData, CrosswordClue } from "@/lib/types";

export default function CrosswordPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<CrosswordPuzzleData | null>(null);
  const [puzzleKey, setPuzzleKey] = useState(0);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.PUZZLE_CROSSWORD);
    if (!stored) {
      sessionStorage.setItem(STORAGE_KEYS.REDIRECT_REASON, "No puzzle data found. Generate a new puzzle to play.");
      router.push("/");
      return;
    }
    try {
      setPuzzle(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_CROSSWORD);
      sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      sessionStorage.setItem(STORAGE_KEYS.REDIRECT_REASON, "Puzzle data was corrupted. Generate a new puzzle.");
      router.push("/");
    }
  }, [router]);

  const handleRetry = useCallback(async () => {
    if (!puzzle) return;
    setRegenerating(true);

    try {
      // Crossword clues don't store categories — re-suggest them
      let categories: string[] = ["General"];
      try {
        const catRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: puzzle.title }),
          credentials: "include",
        });
        if (catRes.ok) {
          const catData = await catRes.json();
          categories = (catData.categories ?? []).slice(0, 3).map((c: { name: string }) => c.name);
        }
      } catch { /* use fallback */ }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: puzzle.title,
          difficulty: puzzle.difficulty,
          focusCategories: categories.length >= 2 ? categories : ["General"],
          gameType: "crossword",
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }

      const { _meta, ...newPuzzle } = await res.json();

      sessionStorage.setItem(STORAGE_KEYS.PUZZLE_CROSSWORD, JSON.stringify(newPuzzle));
      sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      setPuzzle(newPuzzle as CrosswordPuzzleData);
      setPuzzleKey((k) => k + 1);
    } catch {
      sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_CROSSWORD);
      sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      sessionStorage.setItem(STORAGE_KEYS.SHOW_CONFIG, puzzle.title);
      router.push("/");
    } finally {
      setRegenerating(false);
    }
  }, [puzzle, router]);

  if (regenerating) return <LoadingOverlay />;
  if (!puzzle) return null;

  return <CrosswordGame key={puzzleKey} puzzle={puzzle} onRetry={handleRetry} />;
}

function CrosswordGame({ puzzle: initialPuzzle, onRetry }: { puzzle: CrosswordPuzzleData; onRetry: () => void }) {
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
    selectCell,
    typeLetter,
    deleteLetter,
    checkWord,
    toggleDirection,
    useHint,
    restoreGame,
  } = useCrosswordGame(puzzle);

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
    return {
      ...state,
      hintedCells: Array.from(state.hintedCells), // Set -> Array for JSON serialization
    } as unknown as Record<string, unknown>;
  }, [state]);

  useAutoSave({
    gameType: "crossword",
    title: puzzleTitle,
    difficulty: puzzle.difficulty,
    puzzleData: puzzle,
    gameStatus: state.gameStatus,
    getGameState,
    onSessionExpired: () => setSessionExpired(true),
    onSaveFailed: () => setToastMessage("Auto-save failed — check your connection"),
  });

  const handleFirstInteraction = () => {
    if (state.gameStatus === "idle") {
      startGame();
    }
  };

  const handleHome = () => router.push("/");

  const handleNewTopic = () => {
    sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_CROSSWORD);
    sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    sessionStorage.setItem(STORAGE_KEYS.SHOW_CONFIG, puzzleTitle);
    router.push("/");
  };

  const handlePlayAgain = () => onRetry();

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await savePuzzle("crossword", puzzle.title, puzzle.difficulty, puzzle);
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

  const handleClueClick = (clue: CrosswordClue) => {
    handleFirstInteraction();
    selectCell(clue.startRow, clue.startCol);
  };

  // Get active clue number for ClueList highlighting
  const activeCell = puzzle.grid[state.cursorRow]?.[state.cursorCol];
  const activeClueNum =
    state.cursorDirection === "across"
      ? activeCell?.acrossClueNum
      : activeCell?.downClueNum;

  const score = calculateScore(
    state.solvedClues.length,
    state.livesRemaining,
    puzzle.difficulty
  );

  const [showShareSheet, setShowShareSheet] = useState(false);
  const shareData: ShareCardData = {
    gameType: "crossword",
    topic: puzzleTitle,
    difficulty: puzzle.difficulty,
    wordsFound: state.solvedClues.length,
    wordsTotal: puzzle.clues.length,
    livesRemaining: state.livesRemaining,
    score,
  };
  const handleShare = () => setShowShareSheet(true);

  // Save result when game ends
  const savedRef = useRef(false);
  useEffect(() => {
    if ((state.gameStatus === "won" || state.gameStatus === "lost") && !savedRef.current) {
      savedRef.current = true;
      saveResult({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: puzzle.title,
        gameType: "crossword",
        difficulty: puzzle.difficulty,
        score,
        wordsFound: state.solvedClues.length,
        wordsTotal: puzzle.clues.length,
        elapsedSeconds: state.elapsedSeconds,
        livesRemaining: state.livesRemaining,
        hintsUsed: state.hintsUsed,
        outcome: state.gameStatus as "won" | "lost",
      }).then((ok) => {
        if (!ok) setToastMessage("Couldn't save stats — check your connection");
      });
    }
  }, [state.gameStatus, state.solvedClues.length, state.livesRemaining, state.elapsedSeconds, state.hintsUsed, score, puzzle]);

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
          onHint={useHint}
          canHint={state.gameStatus === "playing" && state.livesRemaining > 1}
          hintsUsed={state.hintsUsed}
          onMenu={() => setDrawerOpen(true)}
        />
      </div>

      {/* Desktop: unified game panel */}
      <div className="hidden lg:flex flex-1 min-h-0 items-center justify-center pt-0 pb-6">
        <div className="relative">
          {/* Instructions */}
          <div
            className="absolute right-full top-0 mr-24 flex flex-col gap-2.5 whitespace-nowrap"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <span className="font-ws-mono text-[11px] uppercase tracking-[2px] text-white/50 font-semibold">How to Play</span>
            <div className="flex flex-col gap-2 text-white/45 text-xs font-ws-body">
              <p>1. Tap a cell, type your answer</p>
              <p>2. Press Tab/Enter to check word</p>
              <p>3. Space to toggle direction</p>
              <p>4. Wrong checks cost 1 life</p>
              <p>5. Hints reveal a letter in the word</p>
              <p>6. Solve all clues to win</p>
            </div>
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
                onClick={useHint}
                disabled={state.gameStatus !== "playing" || state.livesRemaining <= 1}
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
            <div className="py-6 pl-4 pr-5 flex items-start justify-center" onClick={handleFirstInteraction}>
              <CrosswordGrid
                grid={puzzle.grid}
                gridSize={puzzle.gridSize}
                cellValues={state.cellValues}
                hintedCells={state.hintedCells}
                cursorRow={state.cursorRow}
                cursorCol={state.cursorCol}
                cursorDirection={state.cursorDirection}
                solvedClues={state.solvedClues}
                gameStatus={state.gameStatus}
                onSelectCell={(r, c) => {
                  handleFirstInteraction();
                  selectCell(r, c);
                }}
                onTypeLetter={typeLetter}
                onDeleteLetter={deleteLetter}
                onCheckWord={checkWord}
                onToggleDirection={toggleDirection}
              />
            </div>

            {/* Divider */}
            <div className="w-px self-stretch" style={{ background: "rgba(255, 255, 255, 0.1)" }} />

            {/* Clue list */}
            <div className="py-6 pr-6 pl-4 flex flex-col gap-5 max-h-[560px] overflow-y-auto">
              <span className="text-[11px] uppercase tracking-[2px] text-white/55 font-heading font-semibold">
                Clues — {state.solvedClues.length}/{puzzle.clues.length}
              </span>
              <ClueList
                clues={puzzle.clues}
                solvedClues={state.solvedClues}
                activeClueNum={activeClueNum}
                activeDirection={state.cursorDirection}
                onClueClick={handleClueClick}
              />
            </div>
          </div>

          {/* Submit button — below grid panel */}
          <div className="flex justify-center" style={{ marginTop: -6 }}>
            <button
              onClick={checkWord}
              disabled={state.gameStatus !== "playing"}
              className="px-8 h-10 font-heading text-[17px] font-bold tracking-wider transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #f7c948, #e5b52e)",
                color: "#1a1430",
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 15px rgba(247, 201, 72, 0.3)",
              }}
            >
              Submit
            </button>
          </div>

          {/* Spacer for fixed bottom stats bar */}
          <div style={{ height: 60 }} />
          <GameStatsBar
            score={score}
            livesRemaining={state.livesRemaining}
            hintsUsed={state.hintsUsed}
            elapsedSeconds={state.elapsedSeconds}
            gameStatus={state.gameStatus}
          />
        </div>
      </div>

      {/* ═══ Mobile: dark layout matching word search ═══ */}
      <div
        className="lg:hidden flex-1 flex flex-col overflow-y-auto"
        style={{ background: "var(--ws-bg)" }}
      >
        {/* Fixed header */}
        <WordSearchHeader
          title={puzzleTitle}
          onTitleChange={setPuzzleTitle}
          onBack={handleHome}
          onHint={useHint}
          canHint={state.gameStatus === "playing" && state.livesRemaining > 1}
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
        />

        {/* Grid — centered with small horizontal padding */}
        <div style={{ padding: "4px 12px" }}>
          <div className="w-full flex justify-center" onClick={handleFirstInteraction}>
            <CrosswordGrid
              grid={puzzle.grid}
              gridSize={puzzle.gridSize}
              cellValues={state.cellValues}
              hintedCells={state.hintedCells}
              cursorRow={state.cursorRow}
              cursorCol={state.cursorCol}
              cursorDirection={state.cursorDirection}
              solvedClues={state.solvedClues}
              gameStatus={state.gameStatus}
              onSelectCell={(r, c) => {
                handleFirstInteraction();
                selectCell(r, c);
              }}
              onTypeLetter={typeLetter}
              onDeleteLetter={deleteLetter}
              onCheckWord={checkWord}
              onToggleDirection={toggleDirection}
              variant="mobile"
            />
          </div>
        </div>

        {/* Submit button — below grid */}
        <div className="flex justify-center" style={{ padding: "0 18px", marginTop: -4 }}>
          <button
            onClick={checkWord}
            disabled={state.gameStatus !== "playing"}
            className="px-7 h-9 font-heading text-[16px] font-bold tracking-wider transition-all active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #f7c948, #e5b52e)",
              color: "#1a1430",
              borderRadius: 12,
              border: "none",
              boxShadow: "0 4px 15px rgba(247, 201, 72, 0.3)",
            }}
          >
            Submit
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: "10px 18px 0" }}>
          <WordProgress
            found={state.solvedClues.length}
            total={puzzle.clues.length}
          />
        </div>

        {/* Clues — two columns, scrolls naturally with page */}
        <div
          style={{
            padding: "10px 18px 12px",
            paddingBottom: "calc(env(safe-area-inset-bottom, 34px) + 12px)",
          }}
        >
          <ClueList
            clues={puzzle.clues}
            solvedClues={state.solvedClues}
            activeClueNum={activeClueNum}
            activeDirection={state.cursorDirection}
            onClueClick={handleClueClick}
            horizontal
          />
        </div>
      </div>

      {/* Modals */}
      {state.gameStatus === "paused" && (
        <PauseMenu
          onResume={resume}
          onQuit={handleNewTopic}
          gameType="crossword"
          shareData={shareData}
          onToast={setToastMessage}
        />
      )}

      <GameDrawer
        gameType="crossword"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNewPuzzle={handleNewTopic}
        onStats={() => { setDrawerOpen(false); setShowStats(true); }}
        onShare={handleShare}
        onSettings={() => { setDrawerOpen(false); setToastMessage("Coming soon"); }}
        onSave={handleSave}
        isSaved={isSaved || isSaving}
      />

      {state.gameStatus === "lost" && (
        <GameOverModal
          wordsFound={state.solvedClues.length}
          wordsTotal={puzzle.clues.length}
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
          wordsFound={state.solvedClues.length}
          wordsTotal={puzzle.clues.length}
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
