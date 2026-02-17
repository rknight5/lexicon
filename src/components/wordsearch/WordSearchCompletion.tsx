"use client";

import { formatTime } from "@/lib/format";

interface WordSearchCompletionProps {
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  livesRemaining: number;
  score: number;
  funFact: string;
  onPlayAgain: () => void;
  onChangeTopic: () => void;
  onHome: () => void;
  onShare?: () => void;
  onSaveToLibrary?: () => void;
  isSavedToLibrary?: boolean;
}

export function WordSearchCompletion({
  wordsFound,
  wordsTotal,
  elapsedSeconds,
  livesRemaining,
  score,
  funFact,
  onPlayAgain,
  onChangeTopic,
  onHome,
  onShare,
  onSaveToLibrary,
  isSavedToLibrary,
}: WordSearchCompletionProps) {
  const isPerfect = livesRemaining === 3;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, #1a1430 0%, #0c0a14 100%)",
      }}
    >
      {/* Radial gold glow */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: 300,
          background: "radial-gradient(ellipse at 50% 0%, rgba(247, 201, 72, 0.1) 0%, transparent 70%)",
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
        {/* Trophy emoji */}
        <span style={{ fontSize: 44, lineHeight: 1 }}>
          {isPerfect ? "\ud83c\udfc6" : "\ud83d\udd25"}
        </span>

        {/* Title */}
        <h2
          className="text-center"
          style={{
            fontFamily: "var(--font-ws-serif)",
            fontSize: 30,
            fontWeight: 400,
            color: "#f7c948",
            marginTop: 12,
          }}
        >
          Puzzle Complete!
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
          <StatCard label="Score" value={String(score)} color="#f7c948" />
          <StatCard label="Time" value={formatTime(elapsedSeconds)} color="#a78bfa" />
          <StatCard label="Lives" value={`${livesRemaining}/3`} color={isPerfect ? "#34d399" : "#ff4d6a"} />
        </div>

        {/* Perfect game badge */}
        {isPerfect && (
          <p
            className="text-center"
            style={{
              fontFamily: "var(--font-ws-body)",
              fontSize: 12,
              fontWeight: 600,
              color: "#f7c948",
              marginTop: 12,
            }}
          >
            Perfect Game!
          </p>
        )}

        {/* Fun fact */}
        {funFact && (
          <div
            className="w-full text-left"
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 14,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-ws-mono)",
                fontSize: 10,
                fontWeight: 700,
                color: "#f7c948",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: 6,
              }}
            >
              Fun Fact
            </p>
            <p
              style={{
                fontFamily: "var(--font-ws-body)",
                fontSize: 13,
                color: "var(--ws-text-muted)",
                lineHeight: 1.5,
              }}
            >
              {funFact}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="w-full flex flex-col" style={{ marginTop: 24, gap: 8 }}>
          {/* Primary — Play Again */}
          <button
            onClick={onPlayAgain}
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
            {onShare && (
              <button
                onClick={onShare}
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
                Share
              </button>
            )}
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
              Create Puzzle
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
