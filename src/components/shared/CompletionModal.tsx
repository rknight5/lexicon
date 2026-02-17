import { Trophy, Star } from "lucide-react";
import { formatTime } from "@/lib/format";

interface CompletionModalProps {
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  livesRemaining: number;
  score: number;
  funFact: string;
  onPlayAgain: () => void;
  onNewTopic: () => void;
  onShare?: () => void;
  onSaveToLibrary?: () => void;
  isSavedToLibrary?: boolean;
}

export function CompletionModal({
  wordsFound,
  wordsTotal,
  elapsedSeconds,
  livesRemaining,
  score,
  funFact,
  onPlayAgain,
  onNewTopic,
  onShare,
  onSaveToLibrary,
  isSavedToLibrary,
}: CompletionModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm flex flex-col"
        style={{
          background: "rgba(22, 14, 42, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(167, 139, 250, 0.15)",
          borderRadius: 20,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          maxHeight: "85vh",
        }}
      >
        {/* Scrollable content */}
        <div className="overflow-y-auto p-6 space-y-4 text-center">
          <div className="flex justify-center">
            <Trophy className="w-10 h-10 text-gold-primary" />
          </div>

          <h2 className="font-heading text-3xl font-bold text-gold-primary text-center">
            Puzzle Complete!
          </h2>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-gold-primary">
              <Star className="w-5 h-5" fill="currentColor" />
              <span className="font-grid text-3xl font-bold">{score}</span>
            </div>
            <p className="font-body text-sm text-center" style={{ color: "var(--white-muted)" }}>
              {wordsFound}/{wordsTotal} words · {formatTime(elapsedSeconds)} · {livesRemaining}/3 lives
            </p>
            {livesRemaining === 3 && (
              <p className="font-heading text-xs text-gold-primary text-center">
                Perfect Game!
              </p>
            )}
          </div>

          {/* Fun fact */}
          {funFact && (
            <div
              className="rounded-2xl p-4 text-left"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                maxHeight: "5.5lh",
                overflowY: "auto",
              }}
            >
              <p className="font-heading text-xs font-bold uppercase tracking-wider text-gold-primary mb-1">
                Fun Fact
              </p>
              <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
                {funFact}
              </p>
            </div>
          )}
        </div>

        {/* Pinned buttons */}
        <div className="flex flex-col items-center gap-3 w-full px-6 pb-6 pt-2 shrink-0">
          <button
            onClick={onPlayAgain}
            className="w-4/5 h-9 rounded-pill font-heading text-xs font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
            }}
          >
            Try Again
          </button>
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
          <button
            onClick={onNewTopic}
            className="w-4/5 h-9 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            New Puzzle
          </button>
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
      </div>
    </div>
  );
}
