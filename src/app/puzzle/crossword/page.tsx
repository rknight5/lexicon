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
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { CrosswordPuzzleData, CrosswordClue } from "@/lib/types";

export default function CrosswordPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<CrosswordPuzzleData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEYS.PUZZLE_CROSSWORD);
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setPuzzle(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_CROSSWORD);
      router.push("/");
    }
  }, [router]);

  if (!puzzle) return null;

  return <CrosswordGame puzzle={puzzle} />;
}

function CrosswordGame({ puzzle: initialPuzzle }: { puzzle: CrosswordPuzzleData }) {
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
  });

  const handleFirstInteraction = () => {
    if (state.gameStatus === "idle") {
      startGame();
    }
  };

  const handleNewTopic = () => {
    sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_CROSSWORD);
    sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    router.push("/");
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_CROSSWORD);
    sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
    router.push("/");
  };

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
          onBack={handleNewTopic}
          gameStatus={state.gameStatus}
          title={puzzleTitle}
          onTitleChange={setPuzzleTitle}
          onStats={() => setShowStats(true)}
          onSave={handleSave}
          isSaved={isSaved || isSaving}
          onHint={useHint}
          canHint={state.gameStatus === "playing" && state.livesRemaining > 1}
          hintsUsed={state.hintsUsed}
        />
      </div>

      {/* Desktop: unified game panel */}
      <div className="hidden lg:flex flex-1 min-h-0 items-center justify-center pt-0 pb-6">
        <div className="relative">
          {/* Instructions */}
          <div className="absolute right-full top-0 mr-24 flex flex-col gap-2.5 text-white/45 text-xs font-body whitespace-nowrap">
            <div>
              <span className="text-[11px] uppercase tracking-[2px] text-white/50 font-heading font-semibold">How to Play</span>
              <div className="h-px bg-white/15 mt-2" />
            </div>
            <p>1. Tap a cell, type your answer</p>
            <p>2. Press Tab/Enter to check word</p>
            <p>3. Space to toggle direction</p>
            <p>4. Wrong checks cost 1 life</p>
            <p>5. Hints reveal a letter in the word</p>
            <p>6. Solve all clues to win</p>
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

          {/* Stats pill below panel */}
          <div className="flex justify-center mt-4">
            <GameStatsBar
              score={score}
              livesRemaining={state.livesRemaining}
              hintsUsed={state.hintsUsed}
              elapsedSeconds={state.elapsedSeconds}
              gameStatus={state.gameStatus}
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

        {/* Grid — centered with 24px side padding */}
        <div style={{ padding: "4px 24px" }}>
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

        {/* Progress bar */}
        <div style={{ padding: "8px 24px 0" }}>
          <WordProgress
            found={state.solvedClues.length}
            total={puzzle.clues.length}
          />
        </div>

        {/* Clues — independently scrollable */}
        <div
          className="flex-1 overflow-y-auto ws-pills-scroll"
          style={{
            padding: "8px 18px 12px",
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
        />
      )}

      <GameDrawer
        gameType="crossword"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStats={() => { setDrawerOpen(false); setShowStats(true); }}
        onShare={() => {
          const msg = `I'm playing Crossword on Lexicon!\nTopic: ${puzzleTitle}\nDifficulty: ${puzzle.difficulty}`;
          navigator.clipboard.writeText(msg).then(() => {
            setToastMessage("Copied to clipboard!");
          });
        }}
        onSettings={() => { setDrawerOpen(false); setToastMessage("Coming soon"); }}
      />

      {state.gameStatus === "lost" && (
        <GameOverModal
          wordsFound={state.solvedClues.length}
          wordsTotal={puzzle.clues.length}
          elapsedSeconds={state.elapsedSeconds}
          onTryAgain={handlePlayAgain}
          onNewTopic={handleNewTopic}
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
