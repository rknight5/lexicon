"use client";

import { useState } from "react";
import { ModalShell } from "@/components/shared/ModalShell";
import type { GameType } from "@/lib/types";

const RULES: Record<GameType, string[]> = {
  wordsearch: [
    "Drag across letters to form words",
    "Words can go in any direction",
    "Wrong words cost 1 life",
    "Hints reveal a word\u2019s direction",
    "Find all words to win",
  ],
  crossword: [
    "Tap a cell, type your answer",
    "Press Check to verify a word",
    "Tap again to toggle direction",
    "Wrong checks cost 1 life",
    "Hints reveal a letter",
    "Solve all clues to win",
  ],
  anagram: [
    "Tap scrambled letters to spell",
    "Tap answer slots to remove",
    "Wrong answers & skips cost 1 life",
    "Hints lock a letter in place",
    "Unscramble all words to win",
  ],
};

interface GameMenuProps {
  gameType: GameType;
  onResume: () => void;
  onStats: () => void;
  onShare: () => void;
  onExit: () => void;
}

export function GameMenu({
  gameType,
  onResume,
  onStats,
  onShare,
  onExit,
}: GameMenuProps) {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [showRules, setShowRules] = useState(false);

  if (confirmQuit) {
    return (
      <ModalShell>
        <h2 className="font-heading text-2xl font-bold text-center">
          Exit Game?
        </h2>
        <p
          className="text-sm text-center"
          style={{ color: "var(--white-muted)" }}
        >
          Your progress is saved automatically.
        </p>
        <div className="space-y-3">
          <button
            onClick={onExit}
            className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-white bg-pink-accent/20 border-2 border-pink-accent transition-all hover:-translate-y-0.5"
          >
            Exit
          </button>
          <button
            onClick={() => setConfirmQuit(false)}
            className="w-full h-10 rounded-pill font-body text-sm text-white/70 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell spaceY="space-y-3" onClickOutside={onResume}>
      {/* Resume — gold CTA */}
      <button
        onClick={onResume}
        className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
        style={{
          background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
          boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
        }}
      >
        Resume
      </button>

      {/* How to Play — expandable */}
      <button
        onClick={() => setShowRules(!showRules)}
        className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          color: "var(--white-muted)",
        }}
      >
        How to Play
      </button>

      {showRules && (
        <div
          className="rounded-xl p-4 space-y-1.5"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {RULES[gameType].map((rule, i) => (
            <p
              key={i}
              className="text-xs font-body"
              style={{ color: "rgba(255, 255, 255, 0.55)" }}
            >
              {i + 1}. {rule}
            </p>
          ))}
        </div>
      )}

      {/* Stats */}
      <button
        onClick={onStats}
        className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          color: "var(--white-muted)",
        }}
      >
        Stats
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          color: "var(--white-muted)",
        }}
      >
        Share Puzzle
      </button>

      {/* Exit Game */}
      <button
        onClick={() => setConfirmQuit(true)}
        className="w-full h-10 rounded-pill font-body text-sm transition-colors"
        style={{ color: "rgba(255, 255, 255, 0.45)" }}
      >
        Exit Game
      </button>
    </ModalShell>
  );
}
