"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PuzzleGrid } from "@/components/wordsearch/PuzzleGrid";
import { WordProgress } from "@/components/wordsearch/WordProgress";
import { WordList } from "@/components/wordsearch/WordList";
import { GameBar } from "@/components/shared/GameBar";
import { GameStatsBar } from "@/components/shared/GameStatsBar";
import { PauseMenu } from "@/components/shared/PauseMenu";
import { GameOverModal } from "@/components/shared/GameOverModal";
import { CompletionModal } from "@/components/shared/CompletionModal";
import { StatsModal } from "@/components/shared/StatsModal";
import { useWordSearchGame } from "@/hooks/useWordSearchGame";
import { calculateScore } from "@/lib/scoring";
import { saveResult, savePuzzle } from "@/lib/storage";
import { useAutoSave } from "@/hooks/useAutoSave";
import { Toast } from "@/components/shared/Toast";
import { Bookmark } from "lucide-react";
import type { PuzzleData } from "@/lib/types";

export default function WordSearchPage() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<PuzzleData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("lexicon-puzzle");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setPuzzle(JSON.parse(stored));
    } catch {
      sessionStorage.removeItem("lexicon-puzzle");
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
  const [isSaved, setIsSaved] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
  });

  // Restore saved game state if present
  useEffect(() => {
    const savedState = sessionStorage.getItem("lexicon-game-state");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      restoreGame(parsed);
      sessionStorage.removeItem("lexicon-game-state");
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
      void saveResult({
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
      });
    }
  }, [state.gameStatus, state.foundWords.length, state.livesRemaining, state.elapsedSeconds, state.hintsUsed, puzzle]);

  // Start game on first grid interaction
  const handleFirstInteraction = () => {
    if (state.gameStatus === "idle") {
      startGame();
    }
  };

  const handleNewTopic = () => {
    sessionStorage.removeItem("lexicon-puzzle");
    sessionStorage.removeItem("lexicon-game-state");
    router.push("/");
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem("lexicon-puzzle");
    sessionStorage.removeItem("lexicon-game-state");
    router.push("/");
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const ok = await savePuzzle("wordsearch", puzzle.title, puzzle.difficulty, puzzle);
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
          {/* Instructions: positioned to the left of the panel, top-aligned */}
          <div className="absolute right-full top-0 mr-23 flex flex-col gap-2.5 text-white/45 text-xs font-body whitespace-nowrap">
            <div>
              <span className="text-[11px] uppercase tracking-[2px] text-white/50 font-heading font-semibold">How to Play</span>
              <div className="h-px bg-white/15 mt-2" />
            </div>
            <p>1. Drag across letters to form words</p>
            <p>2. Words can go in any direction</p>
            <p>3. Wrong words cost 1 life</p>
            <p>4. Hints reveal a word's direction</p>
            <p>5. Find all words to win</p>
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
                <span className="text-2xl pointer-events-none">💡</span>
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
              />
            </div>

            {/* Word list to the right of grid */}
            <div className="py-5 pr-8 pl-3 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] uppercase tracking-[2px] text-white/55 font-heading font-semibold">Progress</span>
                <WordProgress
                  found={state.foundWords.length}
                  total={puzzle.words.length}
                />
              </div>
              <WordList
                words={puzzle.words}
                foundWords={state.foundWords}
                hintedWords={state.hintedWords}
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
              lastMissTimestamp={lastMissTimestamp}
            />
          </div>
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="lg:hidden flex-1 flex flex-col items-center px-3 py-4 gap-4">
        <WordProgress
          found={state.foundWords.length}
          total={puzzle.words.length}
        />
        <div>
          <PuzzleGrid
            grid={puzzle.grid}
            gridSize={puzzle.gridSize}
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
          />
        </div>
        <WordList
          words={puzzle.words}
          foundWords={state.foundWords}
          hintedWords={state.hintedWords}
        />
        <button
          onClick={handleRandomHint}
          disabled={!canHint}
          className="px-5 py-2 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-30 disabled:pointer-events-none"
          style={{
            background: "rgba(255, 215, 0, 0.12)",
            border: "1px solid rgba(255, 215, 0, 0.3)",
            color: "#FFD700",
          }}
        >
          <span className="mr-1.5">💡</span>Hint
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
          wordsFound={state.foundWords.length}
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
          wordsFound={state.foundWords.length}
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
