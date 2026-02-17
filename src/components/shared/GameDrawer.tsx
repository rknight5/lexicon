"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  const handleStats = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      onStats();
    }, 200);
  }, [onClose, onStats]);

  const handleShare = useCallback(() => {
    onShare();
    handleClose();
  }, [onShare, handleClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Invisible backdrop to catch taps outside */}
      <div className="absolute inset-0" onClick={handleClose} />

      {/* Dropdown — anchored top-right below header */}
      <div
        ref={menuRef}
        className="absolute transition-all duration-200 ease-out"
        style={{
          top: "calc(env(safe-area-inset-top, 40px) + 46px)",
          right: 14,
          width: 200,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.95)",
          transformOrigin: "top right",
          background: "rgba(22, 14, 42, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 14,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
      >
        <div className="py-1.5">
          {/* Info */}
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 transition-colors active:bg-white/5"
          >
            <Info style={{ width: 16, height: 16, color: "rgba(255, 255, 255, 0.45)" }} />
            <span
              className="font-body text-[13px] font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              How to Play
            </span>
          </button>

          {showRules && (
            <div
              className="px-4 pb-2 space-y-0.5"
              style={{ paddingLeft: 42 }}
            >
              {RULES[gameType].map((rule, i) => (
                <p
                  key={i}
                  className="font-body"
                  style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.4)" }}
                >
                  {i + 1}. {rule}
                </p>
              ))}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255, 255, 255, 0.06)", margin: "2px 12px" }} />

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 transition-colors active:bg-white/5"
          >
            <Share2 style={{ width: 16, height: 16, color: "rgba(255, 255, 255, 0.45)" }} />
            <span
              className="font-body text-[13px] font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Share Puzzle
            </span>
          </button>

          {/* Stats */}
          <button
            onClick={handleStats}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 transition-colors active:bg-white/5"
          >
            <BarChart2 style={{ width: 16, height: 16, color: "rgba(255, 255, 255, 0.45)" }} />
            <span
              className="font-body text-[13px] font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Stats
            </span>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255, 255, 255, 0.06)", margin: "2px 12px" }} />

          {/* Settings — placeholder */}
          <div
            className="w-full flex items-center gap-2.5 px-4 py-2.5"
            style={{ opacity: 0.3 }}
          >
            <Settings style={{ width: 16, height: 16, color: "rgba(255, 255, 255, 0.45)" }} />
            <div className="flex flex-col">
              <span
                className="font-body text-[13px] font-medium"
                style={{ color: "rgba(255, 255, 255, 0.8)" }}
              >
                Settings
              </span>
              <span
                className="font-body"
                style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.35)" }}
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
