"use client";

import { useState } from "react";
import { Search, Grid3X3, Shuffle, Brain, Trash2, Bookmark, Flame, Heart, ChevronRight } from "lucide-react";
import type { AutoSaveSummary } from "@/lib/storage";

interface ResumeCardProps {
  autoSave: AutoSaveSummary;
  onResume: () => void;
  onSave: () => Promise<boolean>;
  onDismiss: () => void;
}

const GAME_TYPE_ICON: Record<string, React.ReactNode> = {
  wordsearch: <Search className="w-5 h-5 text-white/40" />,
  crossword: <Grid3X3 className="w-5 h-5 text-white/40" />,
  anagram: <Shuffle className="w-5 h-5 text-white/40" />,
  trivia: <Brain className="w-5 h-5 text-white/40" />,
};

function getProgress(autoSave: AutoSaveSummary): { count: string; label: string; livesRemaining: number } {
  const gs = autoSave.gameState;

  if (autoSave.gameType === "wordsearch") {
    const foundWords = (gs.foundWords as string[]) ?? [];
    const totalWords = (autoSave.puzzleData as { words: unknown[] }).words?.length ?? 0;
    return { count: `${foundWords.length}/${totalWords}`, label: "words found", livesRemaining: (gs.livesRemaining as number) ?? 3 };
  }

  if (autoSave.gameType === "crossword") {
    const solvedClues = (gs.solvedClues as number[]) ?? [];
    const totalClues = (autoSave.puzzleData as { clues: unknown[] }).clues?.length ?? 0;
    return { count: `${solvedClues.length}/${totalClues}`, label: "clues solved", livesRemaining: (gs.livesRemaining as number) ?? 3 };
  }

  if (autoSave.gameType === "trivia") {
    const answers = (gs.answers as string[]) ?? [];
    const correctCount = answers.filter((a) => a === "correct").length;
    const totalQuestions = (autoSave.puzzleData as { questions: unknown[] }).questions?.length ?? 0;
    return { count: `${correctCount}/${totalQuestions}`, label: "questions answered", livesRemaining: (gs.livesRemaining as number) ?? 3 };
  }

  // anagram
  const solvedWords = (gs.solvedWords as string[]) ?? [];
  const totalWords = (autoSave.puzzleData as { words: unknown[] }).words?.length ?? 0;
  return { count: `${solvedWords.length}/${totalWords}`, label: "words unscrambled", livesRemaining: (gs.livesRemaining as number) ?? 3 };
}

export function ResumeCard({ autoSave, onResume, onSave, onDismiss }: ResumeCardProps) {
  const { count, label, livesRemaining } = getProgress(autoSave);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) return;
    const ok = await onSave();
    if (ok) setSaved(true);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  };

  return (
    <div
      className="w-full max-w-xl rounded-2xl overflow-hidden"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid rgba(167, 139, 250, 0.15)",
      }}
    >
      {/* Tappable card body */}
      <button
        onClick={onResume}
        className="w-full flex items-center gap-3 p-4 transition-all hover:brightness-125 active:scale-[0.98] cursor-pointer text-left"
      >
        {/* Game type icon */}
        <div className="flex-shrink-0">
          {GAME_TYPE_ICON[autoSave.gameType]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Title + difficulty + lives */}
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-bold text-white truncate">
              {autoSave.title}
            </span>
            <Flame className="w-3 h-3 text-gold-primary flex-shrink-0" />
            <span className="flex items-center gap-1 flex-shrink-0">
              <Heart className="w-3 h-3 text-pink-accent" fill="currentColor" />
              <span className="text-[11px] text-white/50 font-body">{livesRemaining}</span>
            </span>
          </div>
          {/* Progress */}
          <div className="text-[11px] font-body mt-1">
            <span className="text-white font-bold">{count}</span>
            <span className="text-white/50"> {label}</span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" />
      </button>

      {/* Footer actions */}
      <div
        className="flex items-stretch"
        style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}
      >
        <button
          onClick={handleSave}
          disabled={saved}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer disabled:cursor-default"
          style={{ color: saved ? "#FFD700" : "rgba(255, 255, 255, 0.2)" }}
          onMouseEnter={(e) => { if (!saved) e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)"; }}
          onMouseLeave={(e) => { if (!saved) e.currentTarget.style.color = "rgba(255, 255, 255, 0.2)"; }}
        >
          <Bookmark className="w-3 h-3" fill={saved ? "currentColor" : "none"} />
          <span className="font-body" style={{ fontSize: 9 }}>{saved ? "Saved" : "Save"}</span>
        </button>
        <div className="w-px" style={{ background: "rgba(255, 255, 255, 0.06)" }} />
        <button
          onClick={handleDismiss}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors cursor-pointer"
          style={{ color: "rgba(255, 255, 255, 0.2)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255, 255, 255, 0.2)"; }}
        >
          <Trash2 className="w-3 h-3" />
          <span className="font-body" style={{ fontSize: 9 }}>Dismiss</span>
        </button>
      </div>
    </div>
  );
}
