import { Trophy } from "lucide-react";

interface CompletionModalProps {
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  livesRemaining: number;
  funFact: string;
  onPlayAgain: () => void;
  onNewTopic: () => void;
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
  funFact,
  onPlayAgain,
  onNewTopic,
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
          <p className="font-body text-lg">
            <span className="font-bold">{wordsFound}</span>
            <span style={{ color: "var(--white-muted)" }}>
              {" "}/ {wordsTotal} words
            </span>
          </p>
          <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
            Time: {formatTime(elapsedSeconds)} · Lives: {livesRemaining}/3
          </p>
          {livesRemaining === 3 && (
            <p className="font-heading text-sm text-gold-primary">
              Perfect Game! +500 bonus
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

        <div className="space-y-3 pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
            }}
          >
            Play Again
          </button>
          <button
            onClick={onNewTopic}
            className="w-full h-10 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-green-accent border-2 border-green-accent transition-all hover:-translate-y-0.5"
          >
            New Topic
          </button>
        </div>
      </div>
    </div>
  );
}
