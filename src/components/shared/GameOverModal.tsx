import { formatTime } from "@/lib/format";
import { ModalShell } from "@/components/shared/ModalShell";

interface GameOverModalProps {
  wordsFound: number;
  wordsTotal: number;
  elapsedSeconds: number;
  onTryAgain: () => void;
  onNewTopic: () => void;
  onSaveToLibrary?: () => void;
  isSavedToLibrary?: boolean;
}

export function GameOverModal({
  wordsFound,
  wordsTotal,
  elapsedSeconds,
  onTryAgain,
  onNewTopic,
  onSaveToLibrary,
  isSavedToLibrary,
}: GameOverModalProps) {
  const progress = wordsTotal > 0 ? (wordsFound / wordsTotal) * 100 : 0;

  return (
    <ModalShell centered>
        <h2 className="font-heading text-3xl font-bold text-pink-accent text-center">
          Game Over
        </h2>

        {/* Score + progress */}
        <div className="space-y-3 w-full">
          <p className="font-body text-center">
            <span className="font-bold text-2xl">{wordsFound}</span>
            <span className="font-bold text-2xl" style={{ color: "var(--white-muted)" }}> / </span>
            <span className="font-bold text-2xl">{wordsTotal}</span>
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

        {/* Buttons */}
        <div className="flex flex-col items-center gap-2.5 w-full pt-4">
          <button
            onClick={onTryAgain}
            className="w-4/5 h-9 rounded-pill font-heading text-xs font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
            }}
          >
            Try Again
          </button>
          <button
            onClick={onNewTopic}
            className="w-4/5 h-9 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            Play a New Game
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
    </ModalShell>
  );
}
