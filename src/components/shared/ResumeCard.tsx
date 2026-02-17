"use client";

import { useState } from "react";
import { Search, Grid3X3, Shuffle, Play, Trash2, Bookmark, Shield, Flame, Skull, Heart, Sparkles } from "lucide-react";
import type { AutoSaveSummary } from "@/lib/storage";

interface ResumeCardProps {
  autoSave: AutoSaveSummary;
  onResume: () => void;
  onSave: () => Promise<boolean>;
  onDismiss: () => void;
}

const GAME_TYPE_ICON: Record<string, React.ReactNode> = {
  wordsearch: <Search className="w-5 h-5 text-white/60" />,
  crossword: <Grid3X3 className="w-5 h-5 text-white/60" />,
  anagram: <Shuffle className="w-5 h-5 text-white/60" />,
};

const DIFFICULTY_ICON: Record<string, React.ReactNode> = {
  easy: <Shield className="w-3 h-3 text-green-accent" />,
  medium: <Flame className="w-3 h-3 text-gold-primary" />,
  hard: <Skull className="w-3 h-3 text-pink-accent" />,
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

  // anagram
  const solvedWords = (gs.solvedWords as string[]) ?? [];
  const totalWords = (autoSave.puzzleData as { words: unknown[] }).words?.length ?? 0;
  return { count: `${solvedWords.length}/${totalWords}`, label: "words unscrambled", livesRemaining: (gs.livesRemaining as number) ?? 3 };
}

export function ResumeCard({ autoSave, onResume, onSave, onDismiss }: ResumeCardProps) {
  const { count, label, livesRemaining } = getProgress(autoSave);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (saved) return;
    const ok = await onSave();
    if (ok) setSaved(true);
  };

  return (
    <div
      className="w-full max-w-xl p-4 rounded-2xl flex flex-col gap-3"
      style={{
        background: "var(--glass-bg)",
        border: "1px solid rgba(167, 139, 250, 0.15)",
      }}
    >
      {/* Title row with icon buttons */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {GAME_TYPE_ICON[autoSave.gameType]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-bold text-white truncate">
              {autoSave.title}
            </span>
            {DIFFICULTY_ICON[autoSave.difficulty]}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] font-body">
              <span className="text-white font-bold">{count}</span>
              <span className="text-white/50"> {label}</span>
            </span>
            <span className="text-[11px] text-white/50 font-body flex items-center gap-1">
              <Heart className="w-3 h-3 text-pink-accent" fill="currentColor" />
              {livesRemaining}
            </span>
          </div>
        </div>
        {/* Save & Delete icon buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex items-center justify-center transition-all hover:brightness-125 active:scale-90 disabled:opacity-40"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.06)",
            }}
            title={saved ? "Saved to library" : "Save to library"}
          >
            <Bookmark
              className="w-4 h-4"
              style={{ color: saved ? "#FFD700" : "rgba(255, 255, 255, 0.5)" }}
              fill={saved ? "currentColor" : "none"}
            />
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center justify-center transition-all hover:brightness-125 active:scale-90"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(255, 255, 255, 0.06)",
            }}
            title="Delete saved game"
          >
            <Trash2 className="w-4 h-4" style={{ color: "rgba(255, 255, 255, 0.5)" }} />
          </button>
        </div>
      </div>

      {/* Full-width Continue button */}
      <button
        onClick={onResume}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97]"
        style={{
          background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
          boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
          color: "#1a0a2e",
        }}
      >
        <Sparkles className="w-4 h-4" />
        Continue
      </button>
    </div>
  );
}
