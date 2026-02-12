"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CrosswordGrid } from "@/components/crossword/CrosswordGrid";
import { ClueList } from "@/components/crossword/ClueList";
import { GameBar } from "@/components/shared/GameBar";
import { GameStatsBar } from "@/components/shared/GameStatsBar";
import { PauseMenu } from "@/components/shared/PauseMenu";
import { GameOverModal } from "@/components/shared/GameOverModal";
import { CompletionModal } from "@/components/shared/CompletionModal";
import { StatsModal } from "@/components/shared/StatsModal";
import { useCrosswordGame } from "@/hooks/useCrosswordGame";
import { calculateScore } from "@/lib/scoring";
import { saveResult, savePuzzle } from "@/lib/storage";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Toast } from "@/components/shared/Toast";
import { Bookmark } from "lucide-react";
import type { CrosswordPuzzleData, CrosswordClue } from "@/lib/types";

export default function CrosswordPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<CrosswordPuzzleData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lexicon-puzzle-crossword");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setPuzzle(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem("lexicon-puzzle-crossword");
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
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
    const savedState = sessionStorage.getItem("lexicon-game-state");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      restoreGame(parsed);
      sessionStorage.removeItem("lexicon-game-state");
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
  });

  const handleFirstInteraction = () => {
    if (state.gameStatus === "idle") {
      startGame();
    }
  };

  const handleNewTopic = () => {
    sessionStorage.removeItem("lexicon-puzzle-crossword");
    sessionStorage.removeItem("lexicon-game-state");
    router.push("/");
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem("lexicon-puzzle-crossword");
    sessionStorage.removeItem("lexicon-game-state");
    router.push("/");
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const ok = await savePuzzle("crossword", puzzle.title, puzzle.difficulty, puzzle);
      if (ok) {
        setIsSaved(true);
        setToastMessage("Saved to library");
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
      void saveResult({
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
      });
    }
  }, [state.gameStatus, state.solvedClues.length, state.livesRemaining, state.elapsedSeconds, state.hintsUsed, score, puzzle]);

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

          <div
            className="flex rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Grid */}
            <div className="p-5 flex items-center" onClick={handleFirstInteraction}>
              <CrosswordGrid
                grid={puzzle.grid}
                gridSize={puzzle.gridSize}
                cellValues={state.cellValues}
                hintedCells={state.hintedCells}
                cursorRow={state.cursorRow}
                cursorCol={state.cursorCol}
                cursorDirection={state.cursorDirection}
                solvedClues={state.solvedClues}
                livesRemaining={state.livesRemaining}
                gameStatus={state.gameStatus}
                onSelectCell={(r, c) => {
                  handleFirstInteraction();
                  selectCell(r, c);
                }}
                onTypeLetter={typeLetter}
                onDeleteLetter={deleteLetter}
                onCheckWord={checkWord}
                onToggleDirection={toggleDirection}
                onHint={useHint}
              />
            </div>

            {/* Clue list */}
            <div className="py-5 pr-8 pl-3 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
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

      {/* Mobile: stacked layout */}
      <div className="lg:hidden flex-1 flex flex-col items-center px-3 py-4 gap-4">
        <div className="text-[11px] uppercase tracking-[2px] text-white/55 font-heading font-semibold">
          {state.solvedClues.length}/{puzzle.clues.length} Clues
        </div>
        <div onClick={handleFirstInteraction}>
          <CrosswordGrid
            grid={puzzle.grid}
            gridSize={puzzle.gridSize}
            cellValues={state.cellValues}
            hintedCells={state.hintedCells}
            cursorRow={state.cursorRow}
            cursorCol={state.cursorCol}
            cursorDirection={state.cursorDirection}
            solvedClues={state.solvedClues}
            livesRemaining={state.livesRemaining}
            gameStatus={state.gameStatus}
            onSelectCell={(r, c) => {
              handleFirstInteraction();
              selectCell(r, c);
            }}
            onTypeLetter={typeLetter}
            onDeleteLetter={deleteLetter}
            onCheckWord={checkWord}
            onToggleDirection={toggleDirection}
            onHint={useHint}
          />
        </div>
        <ClueList
          clues={puzzle.clues}
          solvedClues={state.solvedClues}
          activeClueNum={activeClueNum}
          activeDirection={state.cursorDirection}
          onClueClick={handleClueClick}
        />
        <GameStatsBar
          score={score}
          livesRemaining={state.livesRemaining}
          hintsUsed={state.hintsUsed}
          elapsedSeconds={state.elapsedSeconds}
          gameStatus={state.gameStatus}
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
