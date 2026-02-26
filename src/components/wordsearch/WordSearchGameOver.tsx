"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Plus, Share2, Save, Clock, LayoutGrid } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { PlacedWord } from "@/lib/types";

function getLossContent(found: number, total: number) {
  if (total === 0 || found === 0)
    return { emoji: "\ud83d\ude14", title: "Tough one", subtitle: "Better luck next time" };
  const pct = found / total;
  if (pct >= 0.5)
    return { emoji: "\ud83d\udd25", title: "So close!", subtitle: "Almost had it" };
  return { emoji: "\ud83d\udcaa", title: "Good effort", subtitle: "You\u2019re getting closer" };
}

interface WordSearchGameOverProps {
  wordsFound: number;
  wordsTotal: number;
  missedWords: PlacedWord[];
  elapsedSeconds: number;
  score: number;
  onRetryPuzzle: () => void;
  onNewPuzzle: () => void;
  onShare?: () => void;
  onSaveToLibrary?: () => void;
  isSavedToLibrary?: boolean;
}

export function WordSearchGameOver({
  wordsFound,
  wordsTotal,
  missedWords,
  elapsedSeconds,
  onRetryPuzzle,
  onNewPuzzle,
  onShare,
  onSaveToLibrary,
  isSavedToLibrary,
}: WordSearchGameOverProps) {
  const [showAllMissed, setShowAllMissed] = useState(false);
  const missedCount = missedWords.length;
  const visibleMissed = showAllMissed ? missedWords : missedWords.slice(0, 6);
  const hiddenCount = missedCount - 6;

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
  const ringColor = "#ff4d6a";

  const { emoji, title, subtitle } = getLossContent(wordsFound, wordsTotal);

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
          background: "radial-gradient(ellipse at 50% 0%, rgba(167, 139, 250, 0.12) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative flex flex-col items-center w-full max-w-sm"
        style={{
          padding: "0 24px",
          paddingTop: "calc(env(safe-area-inset-top, 40px) + 48px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 34px) + 10px)",
        }}
      >
        {/* TIER 1 — Emotion + Score */}
        <span style={{ fontSize: 56, lineHeight: 1 }}>{emoji}</span>

        <h2
          className="text-white text-center"
          style={{
            fontFamily: "var(--font-ws-serif)",
            fontSize: 30,
            fontWeight: 400,
            marginTop: 12,
          }}
        >
          {title}
        </h2>

        <p
          style={{
            fontFamily: "var(--font-ws-body)",
            fontSize: 13,
            color: "var(--ws-text-muted)",
            marginTop: 4,
          }}
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
            <div style={{ fontFamily: "var(--font-ws-mono)", fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
              <span className="text-white">{wordsFound}</span>
              <span style={{ color: "rgba(255, 255, 255, 0.35)" }}>/{wordsTotal}</span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-ws-body)",
                fontSize: 12,
                color: "rgba(255, 255, 255, 0.4)",
                marginTop: 2,
              }}
            >
              words
            </span>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex items-center justify-center gap-3" style={{ marginTop: 16 }}>
          <div
            className="flex items-center gap-1.5"
            style={{
              fontFamily: "var(--font-ws-body)",
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
            className="flex items-center gap-1.5"
            style={{
              fontFamily: "var(--font-ws-body)",
              fontSize: 13,
              color: "rgba(255, 255, 255, 0.5)",
              padding: "6px 14px",
              borderRadius: 20,
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Word Search
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
                  className="flex-1 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                  style={{
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    fontFamily: "var(--font-ws-body)",
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
                  className="flex-1 flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                  style={{
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    fontFamily: "var(--font-ws-body)",
                    color: isSavedToLibrary ? "#f7c948" : "rgba(255, 255, 255, 0.5)",
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

        {/* TIER 3 — Missed Words */}
        {missedCount > 0 && (
          <div
            className="w-full"
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 16,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span
                style={{
                  fontFamily: "var(--font-ws-mono)",
                  fontSize: 10,
                  color: "var(--ws-text-dim)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Missed Words
              </span>
              {missedCount > 6 && (
                <button
                  onClick={() => setShowAllMissed(!showAllMissed)}
                  className="cursor-pointer"
                  style={{
                    fontFamily: "var(--font-ws-body)",
                    fontSize: 10,
                    color: "#a78bfa",
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  {showAllMissed ? "Show less \u2191" : `Show all ${missedCount} \u2193`}
                </button>
              )}
            </div>
            <div className="flex flex-wrap" style={{ gap: 6 }}>
              {visibleMissed.map((word) => (
                <span
                  key={word.word}
                  style={{
                    fontFamily: "var(--font-ws-mono)",
                    fontSize: 11,
                    textTransform: "uppercase",
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "rgba(255, 77, 106, 0.08)",
                    border: "1px solid rgba(255, 77, 106, 0.15)",
                    color: "rgba(255, 77, 106, 0.7)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {word.word}
                </span>
              ))}
              {!showAllMissed && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllMissed(true)}
                  className="cursor-pointer"
                  style={{
                    fontFamily: "var(--font-ws-mono)",
                    fontSize: 11,
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    color: "var(--ws-text-dim)",
                  }}
                >
                  +{hiddenCount} more
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
