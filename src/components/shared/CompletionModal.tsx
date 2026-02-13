import { Trophy, Star } from "lucide-react";
import { formatTime } from "@/lib/format";
import { ModalShell } from "@/components/shared/ModalShell";

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
    <ModalShell centered>
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

        {/* Buttons */}
        <div className="flex flex-col items-center gap-2 w-full pt-4">
          <button
            onClick={onPlayAgain}
            className="w-full h-8 rounded-pill font-heading text-xs font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
            }}
          >
            New Puzzle
          </button>
          <button
            onClick={onNewTopic}
            className="w-full h-8 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97]"
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
              className={`w-full h-8 rounded-pill font-body text-sm transition-colors text-center ${
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
