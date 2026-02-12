import { Trophy, Star, Bookmark } from "lucide-react";

interface CompletionModalProps {
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  livesRemaining: number;
  score: number;
  funFact: string;
  onPlayAgain: () => void;
  onNewTopic: () => void;
  onSaveToLibrary?: () => void;
  isSavedToLibrary?: boolean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  onSaveToLibrary,
  isSavedToLibrary,
}: CompletionModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "var(--overlay-dark)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-card p-6 space-y-4 text-center"
        style={{
          background: "linear-gradient(135deg, #2D1B69 0%, #5B2D8E 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex justify-center">
          <Trophy className="w-10 h-10 text-gold-primary" />
        </div>

        <h2 className="font-heading text-3xl font-bold text-gold-primary">
          Puzzle Complete!
        </h2>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-gold-primary">
            <Star className="w-5 h-5" fill="currentColor" />
            <span className="font-grid text-3xl font-bold">{score}</span>
          </div>
          <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
            {wordsFound}/{wordsTotal} words · {formatTime(elapsedSeconds)} · {livesRemaining}/3 lives
          </p>
          {livesRemaining === 3 && (
            <p className="font-heading text-xs text-gold-primary">
              Perfect Game!
            </p>
          )}
        </div>

        {/* Fun fact */}
        <div
          className="rounded-2xl p-4 text-left"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <p className="font-heading text-xs font-bold uppercase tracking-wider text-gold-primary mb-1">
            Fun Fact
          </p>
          <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
            {funFact}
          </p>
        </div>

        {onSaveToLibrary && (
          <button
            onClick={onSaveToLibrary}
            disabled={isSavedToLibrary}
            className={`flex items-center justify-center gap-2 w-full py-2 rounded-pill font-body text-sm transition-colors ${
              isSavedToLibrary ? "text-gold-primary" : "text-white/60 hover:text-white/80"
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isSavedToLibrary ? "currentColor" : "none"} />
            {isSavedToLibrary ? "Saved to Library" : "Save to Library"}
          </button>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full h-11 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
            }}
          >
            New Puzzle
          </button>
          <button
            onClick={onNewTopic}
            className="w-full h-10 rounded-pill font-body text-sm text-white/70 hover:text-white transition-colors"
          >
            Change Topic
          </button>
        </div>
      </div>
    </div>
  );
}
