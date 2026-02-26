import { useState } from "react";
import { formatTime } from "@/lib/format";
import { ModalShell } from "@/components/shared/ModalShell";

interface GameOverModalProps {
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  onRetryPuzzle: () => void;
  onNewPuzzle: () => void;
  onShare?: () => void;
  onSaveToLibrary?: () => void;
  isSavedToLibrary?: boolean;
  missedItems?: { label: string }[];
  missedItemsTitle?: string;
}

export function GameOverModal({
  wordsFound,
  wordsTotal,
  elapsedSeconds,
  onRetryPuzzle,
  onNewPuzzle,
  onShare,
  onSaveToLibrary,
  isSavedToLibrary,
  missedItems,
  missedItemsTitle = "Missed Words",
}: GameOverModalProps) {
  const progress = wordsTotal > 0 ? (wordsFound / wordsTotal) * 100 : 0;
  const [showAllMissed, setShowAllMissed] = useState(false);
  const missedCount = missedItems?.length ?? 0;
  const visibleMissed = showAllMissed ? missedItems : missedItems?.slice(0, 6);
  const hiddenCount = missedCount - 6;

  return (
    <ModalShell centered>
        <div className="flex justify-center text-4xl" aria-hidden>
          😔
        </div>

        <h2 className="font-heading text-3xl font-bold text-pink-accent text-center">
          Game Over
        </h2>

        {/* Score + progress */}
        <div className="space-y-3 w-full">
          <p className="font-body text-center">
            <span className="font-bold text-lg">{wordsFound}</span>
            <span className="font-bold text-lg" style={{ color: "var(--white-muted)" }}> / </span>
            <span className="font-bold text-lg">{wordsTotal}</span>
            <span className="text-sm" style={{ color: "var(--white-muted)" }}>
              {" "}words found
            </span>
          </p>

          {/* Progress bar */}
          <div className="w-1/2 mx-auto h-1 rounded-full overflow-hidden" style={{ background: "rgba(255, 255, 255, 0.1)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: progress >= 80 ? "linear-gradient(90deg, #FFD700, #E5A100)" : progress >= 50 ? "linear-gradient(90deg, #FF8C00, #E57300)" : "linear-gradient(90deg, #FF6B6B, #E54545)",
              }}
            />
          </div>

          <p className="font-body text-sm text-center" style={{ color: "var(--white-muted)" }}>
            Time: {formatTime(elapsedSeconds)}
          </p>
        </div>

        {/* Missed items */}
        {visibleMissed && visibleMissed.length > 0 && (
          <div className="w-full" style={{ marginTop: 4 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
              <span
                className="uppercase font-semibold"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--white-muted)",
                  letterSpacing: "0.5px",
                }}
              >
                {missedItemsTitle}
              </span>
              {missedCount > 6 && (
                <button
                  onClick={() => setShowAllMissed(!showAllMissed)}
                  className="cursor-pointer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "#a78bfa",
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                >
                  {showAllMissed ? "Show less \u2191" : "Show all \u2193"}
                </button>
              )}
            </div>
            <div
              className="grid"
              style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}
            >
              {visibleMissed.map((item) => (
                <div
                  key={item.label}
                  className="text-center"
                  style={{
                    fontFamily: "var(--font-mono)",
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
                  {item.label}
                </div>
              ))}
              {!showAllMissed && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllMissed(true)}
                  className="text-center cursor-pointer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9.5px",
                    padding: "5px 4px",
                    borderRadius: 6,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    color: "var(--white-muted)",
                  }}
                >
                  +{hiddenCount} more
                </button>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col items-center gap-3 w-full pt-4">
          <div className="flex gap-3 w-4/5">
            <button
              onClick={onRetryPuzzle}
              className="flex-1 h-9 rounded-pill font-heading text-xs font-bold uppercase tracking-wider text-purple-deep transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
                boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)",
              }}
            >
              Retry This Puzzle
            </button>
            <button
              onClick={onNewPuzzle}
              className="flex-1 h-9 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              New Puzzle
            </button>
          </div>
          {onShare && (
            <button
              onClick={onShare}
              className="w-4/5 h-9 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "rgba(255, 255, 255, 0.8)",
              }}
            >
              Share Results
            </button>
          )}
          {onSaveToLibrary && (
            <button
              onClick={onSaveToLibrary}
              disabled={isSavedToLibrary}
              className={`w-4/5 h-9 rounded-pill font-body text-sm transition-colors text-center ${
                isSavedToLibrary ? "text-gold-primary" : "text-white/50 hover:text-white/70"
              }`}
            >
              {isSavedToLibrary ? "Saved to Library" : "Save to Library"}
            </button>
          )}
        </div>
    </ModalShell>
  );
}
