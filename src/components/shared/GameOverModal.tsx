import { Bookmark } from "lucide-react";
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
  return (
    <ModalShell centered>
        <h2 className="font-heading text-3xl font-bold text-pink-accent">
          Game Over
        </h2>

        <div className="space-y-2">
          <p className="font-body text-lg">
            <span className="font-bold">{wordsFound}</span>
            <span style={{ color: "var(--white-muted)" }}>
              {" "}/ {wordsTotal} words found
            </span>
          </p>
          <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
            Time: {formatTime(elapsedSeconds)}
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
            onClick={onTryAgain}
            className="w-full h-11 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
            }}
          >
            Try Again
          </button>
          <button
            onClick={onNewTopic}
            className="w-full h-10 rounded-pill font-body text-sm text-white/70 hover:text-white transition-colors"
          >
            Change Topic
          </button>
        </div>
    </ModalShell>
  );
}
