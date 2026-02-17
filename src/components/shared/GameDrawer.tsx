"use client";

import { useState, useEffect, useCallback } from "react";
import { Info, Share2, BarChart2, Settings } from "lucide-react";
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

interface GameDrawerProps {
  gameType: GameType;
  open: boolean;
  onClose: () => void;
  onStats: () => void;
  onShare: () => void;
}

export function GameDrawer({
  gameType,
  open,
  onClose,
  onStats,
  onShare,
}: GameDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Two-phase mount: render hidden, then animate in
  useEffect(() => {
    if (open) {
      // Mount immediately, animate on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setVisible(false);
    // Wait for exit animation before unmounting
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleStats = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      onStats();
    }, 300);
  }, [onClose, onStats]);

  const handleShare = useCallback(() => {
    onShare();
  }, [onShare]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: "auto" }}>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-transform duration-300 ease-out"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          background: "rgba(22, 14, 42, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: "20px 20px 0 0",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderBottom: "none",
          paddingBottom: "env(safe-area-inset-bottom, 34px)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              background: "rgba(255, 255, 255, 0.15)",
            }}
          />
        </div>

        {/* Menu items */}
        <div className="px-5 pb-4 space-y-1">
          {/* Info */}
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98]"
            style={{ background: showRules ? "rgba(255, 255, 255, 0.06)" : "transparent" }}
          >
            <Info style={{ width: 20, height: 20, color: "rgba(255, 255, 255, 0.5)" }} />
            <span
              className="font-body text-sm font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              How to Play
            </span>
          </button>

          {showRules && (
            <div
              className="rounded-lg px-4 py-3 ml-11 space-y-1"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              {RULES[gameType].map((rule, i) => (
                <p
                  key={i}
                  className="text-xs font-body"
                  style={{ color: "rgba(255, 255, 255, 0.45)" }}
                >
                  {i + 1}. {rule}
                </p>
              ))}
            </div>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98]"
          >
            <Share2 style={{ width: 20, height: 20, color: "rgba(255, 255, 255, 0.5)" }} />
            <span
              className="font-body text-sm font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Share Puzzle
            </span>
          </button>

          {/* Stats */}
          <button
            onClick={handleStats}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors active:scale-[0.98]"
          >
            <BarChart2 style={{ width: 20, height: 20, color: "rgba(255, 255, 255, 0.5)" }} />
            <span
              className="font-body text-sm font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Stats
            </span>
          </button>

          {/* Settings — placeholder */}
          <div
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ opacity: 0.35 }}
          >
            <Settings style={{ width: 20, height: 20, color: "rgba(255, 255, 255, 0.5)" }} />
            <div className="flex flex-col">
              <span
                className="font-body text-sm font-medium"
                style={{ color: "rgba(255, 255, 255, 0.8)" }}
              >
                Settings
              </span>
              <span
                className="font-body text-[10px]"
                style={{ color: "rgba(255, 255, 255, 0.4)" }}
              >
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
