"use client";

import { useState } from "react";
import { Search, Grid3X3, Shuffle, Play, Trash2, Bookmark, Shield, Flame, Skull, Heart } from "lucide-react";
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
};

const DIFFICULTY_ICON: Record<string, React.ReactNode> = {
  easy: <Shield className="w-3 h-3 text-green-accent" />,
  medium: <Flame className="w-3 h-3 text-gold-primary" />,
  hard: <Skull className="w-3 h-3 text-pink-accent" />,
};

function getProgress(autoSave: AutoSaveSummary): { line: string; livesRemaining: number } {
  const gs = autoSave.gameState;

  if (autoSave.gameType === "wordsearch") {
    const foundWords = (gs.foundWords as string[]) ?? [];
    const totalWords = (autoSave.puzzleData as { words: unknown[] }).words?.length ?? 0;
    return { line: `${foundWords.length}/${totalWords} words found`, livesRemaining: (gs.livesRemaining as number) ?? 3 };
  }

  if (autoSave.gameType === "crossword") {
    const solvedClues = (gs.solvedClues as number[]) ?? [];
    const totalClues = (autoSave.puzzleData as { clues: unknown[] }).clues?.length ?? 0;
    return { line: `${solvedClues.length}/${totalClues} clues solved`, livesRemaining: (gs.livesRemaining as number) ?? 3 };
  }

  // anagram
  const solvedWords = (gs.solvedWords as string[]) ?? [];
  const totalWords = (autoSave.puzzleData as { words: unknown[] }).words?.length ?? 0;
  return { line: `${solvedWords.length}/${totalWords} words unscrambled`, livesRemaining: (gs.livesRemaining as number) ?? 3 };
}

export function ResumeCard({ autoSave, onResume, onSave, onDismiss }: ResumeCardProps) {
  const { line, livesRemaining } = getProgress(autoSave);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (saved) return;
    const ok = await onSave();
    if (ok) setSaved(true);
  };

  return (
    <div
      className="w-full max-w-md mb-6 p-4 rounded-2xl space-y-3"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
        borderLeft: "3px solid #FFD700",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {GAME_TYPE_ICON[autoSave.gameType]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading text-sm font-bold text-white truncate">
            {autoSave.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {DIFFICULTY_ICON[autoSave.difficulty]}
            <span className="text-[11px] text-white/30 font-body">{line}</span>
            <span className="text-[11px] text-white/30 font-body flex items-center gap-0.5">
              <Heart className="w-3 h-3 text-pink-accent" fill="currentColor" />
              {livesRemaining}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onResume}
          className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-heading font-bold px-3 py-1.5 rounded-pill transition-all hover:brightness-125 active:scale-95"
          style={{ background: "rgba(255, 215, 0, 0.15)", color: "#FFD700" }}
          title="Resume game"
        >
          <Play className="w-3 h-3" fill="currentColor" />
          Continue
        </button>
        <button
          onClick={handleSave}
          disabled={saved}
          className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-heading font-bold px-3 py-1.5 rounded-pill transition-all hover:brightness-125 active:scale-95 disabled:opacity-50"
          style={{ background: "rgba(0, 229, 255, 0.12)", color: saved ? "#00E5FF" : "#00E5FF" }}
          title={saved ? "Saved to library" : "Save to library"}
        >
          <Bookmark className="w-3 h-3" fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save"}
        </button>
        <button
          onClick={onDismiss}
          className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-heading font-bold px-3 py-1.5 rounded-pill transition-all hover:brightness-125 active:scale-95"
          style={{ background: "rgba(255, 64, 129, 0.15)", color: "#FF4081" }}
          title="Delete saved game"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
