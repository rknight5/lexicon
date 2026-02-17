"use client";

import { useState } from "react";
import { formatTime } from "@/lib/format";
import type { PlacedWord } from "@/lib/types";

interface WordSearchGameOverProps {
  wordsFound: number;
  wordsTotal: number;
  missedWords: PlacedWord[];
  elapsedSeconds: number;
  score: number;
  onTryAgain: () => void;
  onChangeTopic: () => void;
  onHome: () => void;
  onSaveToLibrary?: () => void;
  isSavedToLibrary?: boolean;
}

function getPerformanceEmoji(found: number, total: number): string {
  if (total === 0) return "\ud83d\ude05";
  const pct = found / total;
  if (pct >= 0.8) return "\ud83d\udd25";
  if (pct >= 0.5) return "\ud83d\ude0a";
  return "\ud83d\ude05";
}

export function WordSearchGameOver({
  wordsFound,
  wordsTotal,
  missedWords,
  elapsedSeconds,
  score,
  onTryAgain,
  onChangeTopic,
  onHome,
  onSaveToLibrary,
  isSavedToLibrary,
}: WordSearchGameOverProps) {
  const [showAllMissed, setShowAllMissed] = useState(false);
  const missedCount = missedWords.length;
  const visibleMissed = showAllMissed ? missedWords : missedWords.slice(0, 6);
  const hiddenCount = missedCount - 6;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, #1a1430 0%, #0c0a14 100%)",
      }}
    >
      {/* Radial purple glow */}
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
        {/* Performance emoji */}
        <span style={{ fontSize: 44, lineHeight: 1 }}>
          {getPerformanceEmoji(wordsFound, wordsTotal)}
        </span>

        {/* Title */}
        <h2
          className="text-white text-center"
          style={{
            fontFamily: "var(--font-ws-serif)",
            fontSize: 30,
            fontWeight: 400,
            marginTop: 12,
          }}
        >
          Game Over
        </h2>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-ws-body)",
            fontSize: 13,
            color: "var(--ws-text-muted)",
            marginTop: 3,
          }}
        >
          You found {wordsFound} of {wordsTotal} words
        </p>

        {/* Stat cards */}
        <div
          className="grid w-full"
          style={{
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginTop: 28,
          }}
        >
          <StatCard label="Found" value={String(wordsFound)} color="#f7c948" />
          <StatCard label="Time" value={formatTime(elapsedSeconds)} color="#a78bfa" />
          <StatCard label="Missed" value={String(missedCount)} color="#ff4d6a" />
        </div>

        {/* Missed words section */}
        {missedCount > 0 && (
          <div className="w-full" style={{ marginTop: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
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
                  {showAllMissed ? "Show less \u2191" : `Show all \u2193`}
                </button>
              )}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 5,
              }}
            >
              {visibleMissed.map((word) => (
                <div
                  key={word.word}
                  className="text-center"
                  style={{
                    fontFamily: "var(--font-ws-mono)",
                    fontSize: "9.5px",
                    padding: "5px 4px",
                    borderRadius: 6,
                    background: "rgba(255, 77, 106, 0.06)",
                    border: "1px solid rgba(255, 77, 106, 0.08)",
                    color: "rgba(255, 77, 106, 0.55)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {word.word}
                </div>
              ))}
              {!showAllMissed && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllMissed(true)}
                  className="text-center cursor-pointer"
                  style={{
                    fontFamily: "var(--font-ws-mono)",
                    fontSize: "9.5px",
                    padding: "5px 4px",
                    borderRadius: 6,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    color: "var(--ws-text-dim)",
                  }}
                >
                  +{hiddenCount} more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="w-full flex flex-col" style={{ marginTop: 24, gap: 8 }}>
          {/* Primary — Try Again */}
          <button
            onClick={onTryAgain}
            className="w-full cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              padding: 14,
              borderRadius: 14,
              background: "linear-gradient(135deg, #f7c948, #e5b52e)",
              color: "#1a1430",
              fontFamily: "var(--font-ws-body)",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              boxShadow: "0 4px 20px rgba(247, 201, 72, 0.25)",
            }}
          >
            Try Again
          </button>

          {/* Secondary row */}
          <div className="flex" style={{ gap: 8 }}>
            <button
              onClick={onChangeTopic}
              className="flex-1 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                padding: 12,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--ws-text)",
                fontFamily: "var(--font-ws-body)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Change Topic
            </button>
            <button
              onClick={onHome}
              className="flex-1 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                padding: 12,
                borderRadius: 12,
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "var(--ws-text)",
                fontFamily: "var(--font-ws-body)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Home
            </button>
          </div>

          {/* Tertiary — Save to Library */}
          {onSaveToLibrary && (
            <button
              onClick={onSaveToLibrary}
              disabled={isSavedToLibrary}
              className="cursor-pointer transition-colors text-center"
              style={{
                background: "none",
                border: "none",
                fontFamily: "var(--font-ws-body)",
                fontSize: 12,
                color: isSavedToLibrary ? "#f7c948" : "var(--ws-text-dim)",
                marginTop: 8,
                padding: 0,
              }}
            >
              {isSavedToLibrary ? "\ud83d\udd16 Saved to Library" : "\ud83d\udd16 Save to Library"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="flex flex-col items-center"
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderRadius: 12,
        padding: "12px 8px",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-ws-mono)",
          fontSize: 22,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: "var(--font-ws-mono)",
          fontSize: 10,
          color: "var(--ws-text-dim)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginTop: 2,
        }}
      >
        {label}
      </span>
    </div>
  );
}
