"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PuzzleGrid } from "@/components/wordsearch/PuzzleGrid";
import { WordBank } from "@/components/wordsearch/WordBank";
import { GameBar } from "@/components/shared/GameBar";
import { PauseMenu } from "@/components/shared/PauseMenu";
import { GameOverModal } from "@/components/shared/GameOverModal";
import { CompletionModal } from "@/components/shared/CompletionModal";
import { useWordSearchGame } from "@/hooks/useWordSearchGame";
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
    setPuzzle(JSON.parse(stored));
  }, [router]);

  if (!puzzle) return null;

  return <WordSearchGame puzzle={puzzle} />;
}

function WordSearchGame({ puzzle }: { puzzle: PuzzleData }) {
  const router = useRouter();
  const {
    state,
    startGame,
    pause,
    resume,
    startSelection,
    setSelection,
    completeSelection,
    cancelSelection,
  } = useWordSearchGame(puzzle);

  // Start game on first grid interaction
  const handleFirstInteraction = () => {
    if (state.gameStatus === "idle") {
      startGame();
    }
  };

  const handleNewTopic = () => {
    sessionStorage.removeItem("lexicon-puzzle");
    router.push("/");
  };

  const handlePlayAgain = () => {
    sessionStorage.removeItem("lexicon-puzzle");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <GameBar
        difficulty={puzzle.difficulty}
        livesRemaining={state.livesRemaining}
        elapsedSeconds={state.elapsedSeconds}
        onPause={pause}
        gameStatus={state.gameStatus}
      />

      <div className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 px-5 py-4 max-w-5xl mx-auto w-full">
        {/* Puzzle title (mobile) */}
        <div className="w-full lg:hidden text-center mb-2">
          <h2 className="font-heading text-xl font-bold">{puzzle.title}</h2>
        </div>

        <div className="flex-shrink-0 w-full lg:w-auto flex justify-center">
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
          />
        </div>

        <div className="w-full lg:w-64 lg:flex-shrink-0">
          <div className="hidden lg:block mb-4">
            <h2 className="font-heading text-xl font-bold">{puzzle.title}</h2>
          </div>
          <WordBank
            words={puzzle.words}
            foundWords={state.foundWords}
          />
        </div>
      </div>

      {/* Modals */}
      {state.gameStatus === "paused" && (
        <PauseMenu onResume={resume} onQuit={handleNewTopic} />
      )}

      {state.gameStatus === "lost" && (
        <GameOverModal
          wordsFound={state.foundWords.length}
          wordsTotal={puzzle.words.length}
          elapsedSeconds={state.elapsedSeconds}
          onTryAgain={handlePlayAgain}
          onNewTopic={handleNewTopic}
        />
      )}

      {state.gameStatus === "won" && (
        <CompletionModal
          wordsFound={state.foundWords.length}
          wordsTotal={puzzle.words.length}
          elapsedSeconds={state.elapsedSeconds}
          livesRemaining={state.livesRemaining}
          funFact={puzzle.funFact}
          onPlayAgain={handlePlayAgain}
          onNewTopic={handleNewTopic}
        />
      )}
    </div>
  );
}
