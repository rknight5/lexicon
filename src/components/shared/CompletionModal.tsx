"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Plus, Share2, Save, Clock, LayoutGrid } from "lucide-react";
import { formatTime } from "@/lib/format";
import { useWinConfetti } from "@/hooks/useWinConfetti";
import type { GameType } from "@/lib/types";

const GAME_TYPE_LABELS: Record<string, string> = {
  wordsearch: "Word Search",
  crossword: "Crossword",
  anagram: "Anagram",
  trivia: "Trivia",
};

interface CompletionModalProps {
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  livesRemaining: number;
  score: number;
  funFact: string;
  gameType: GameType;
  onRetryPuzzle: () => void;
  onNewPuzzle: () => void;
  onShare?: () => void;
  onSaveToLibrary?: () => void;
  isSavedToLibrary?: boolean;
}

export function CompletionModal({
  wordsFound,
  wordsTotal,
  elapsedSeconds,
  livesRemaining,
  gameType,
  onRetryPuzzle,
  onNewPuzzle,
  onShare,
  onSaveToLibrary,
  isSavedToLibrary,
}: CompletionModalProps) {
  useWinConfetti(livesRemaining);

  const isPerfect = wordsFound === wordsTotal;

  // Score ring animation
  const [ringAnimated, setRingAnimated] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setRingAnimated(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const progress = wordsTotal > 0 ? wordsFound / wordsTotal : 0;
  const ringSize = 120;
  const sw = 5;
  const r = (ringSize - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - (ringAnimated ? progress : 0));
  const ringColor = isPerfect ? "#34d399" : "#E8B730";

  const emoji = isPerfect ? "\ud83c\udf89" : "\ud83c\udfc6";
  const title = isPerfect ? "Perfect!" : "Puzzle Complete!";
  const subtitle = isPerfect
    ? "You found every word"
    : `You found ${wordsFound} of ${wordsTotal}`;
  const glowColor = isPerfect
    ? "rgba(52, 211, 153, 0.1)"
    : "rgba(232, 183, 48, 0.1)";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #1a1430 0%, #0c0a14 100%)" }}
    >
      {/* Radial glow */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: 300,
          background: `radial-gradient(ellipse at 50% 0%, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      <div
        className="relative flex flex-col items-center w-full max-w-sm mx-auto"
        style={{
          padding: "0 24px",
          paddingTop: "calc(env(safe-area-inset-top, 40px) + 48px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 34px) + 10px)",
        }}
      >
        {/* TIER 1 — Emotion + Score */}
        <span style={{ fontSize: 56, lineHeight: 1 }}>{emoji}</span>

        <h2
          className="font-heading text-3xl font-bold text-white text-center"
          style={{ marginTop: 12 }}
        >
          {title}
        </h2>

        <p
          className="font-body text-sm text-center"
          style={{ color: "var(--white-muted)", marginTop: 4 }}
        >
          {subtitle}
        </p>

        {/* Score Ring */}
        <div className="relative" style={{ width: ringSize, height: ringSize, marginTop: 24 }}>
          <svg width={ringSize} height={ringSize}>
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={r}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={sw}
            />
            {progress > 0 && (
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
                style={{
                  transition: "stroke-dashoffset 1s ease-out",
                  filter: `drop-shadow(0 0 6px ${ringColor}50)`,
                }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-grid" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
              <span className="text-white">{wordsFound}</span>
              <span style={{ color: "rgba(255, 255, 255, 0.35)" }}>/{wordsTotal}</span>
            </div>
            <span
              className="font-body"
              style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.4)", marginTop: 2 }}
            >
              words
            </span>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex items-center justify-center gap-3" style={{ marginTop: 16 }}>
          <div
            className="flex items-center gap-1.5 font-body"
            style={{
              fontSize: 13,
              color: "rgba(255, 255, 255, 0.5)",
              padding: "6px 14px",
              borderRadius: 20,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            {formatTime(elapsedSeconds)}
          </div>
          <div
            className="flex items-center gap-1.5 font-body"
            style={{
              fontSize: 13,
              color: "rgba(255, 255, 255, 0.5)",
              padding: "6px 14px",
              borderRadius: 20,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {GAME_TYPE_LABELS[gameType] ?? gameType}
          </div>
        </div>

        {/* TIER 2 — Actions */}
        <div className="w-full flex flex-col" style={{ marginTop: 32, gap: 10 }}>
          <div className="flex" style={{ gap: 10 }}>
            <button
              onClick={onRetryPuzzle}
              className="flex-1 flex items-center justify-center gap-2 font-heading font-bold transition-all active:scale-[0.97]"
              style={{
                height: 52,
                borderRadius: 14,
                background: "#E8B730",
                color: "#1a1430",
                fontSize: 15,
              }}
            >
              <RotateCcw className="w-5 h-5" />
              Retry
            </button>
            <button
              onClick={onNewPuzzle}
              className="flex-1 flex items-center justify-center gap-2 font-heading font-bold transition-all active:scale-[0.97]"
              style={{
                height: 52,
                borderRadius: 14,
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.85)",
                fontSize: 15,
              }}
            >
              <Plus className="w-5 h-5" />
              New Puzzle
            </button>
          </div>

          {(onShare || onSaveToLibrary) && (
            <div className="flex" style={{ gap: 10 }}>
              {onShare && (
                <button
                  onClick={onShare}
                  className="flex-1 flex items-center justify-center gap-2 font-heading transition-all active:scale-[0.97]"
                  style={{
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: 14,
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              )}
              {onSaveToLibrary && (
                <button
                  onClick={onSaveToLibrary}
                  disabled={isSavedToLibrary}
                  className="flex-1 flex items-center justify-center gap-2 font-heading transition-all active:scale-[0.97]"
                  style={{
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: isSavedToLibrary ? "#E8B730" : "rgba(255, 255, 255, 0.5)",
                    fontSize: 14,
                  }}
                >
                  <Save className="w-4 h-4" />
                  {isSavedToLibrary ? "Saved" : "Save"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
