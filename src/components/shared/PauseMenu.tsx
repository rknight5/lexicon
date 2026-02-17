"use client";

import { useState } from "react";
import { HowToPlayModal } from "@/components/shared/HowToPlayModal";
import type { GameType } from "@/lib/types";

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
  gameType: GameType;
}

export function PauseMenu({ onResume, onQuit, gameType }: PauseMenuProps) {
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  if (showHowToPlay) {
    return <HowToPlayModal gameType={gameType} onClose={() => setShowHowToPlay(false)} />;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="w-full max-w-sm p-6 space-y-4"
        style={{
          background: "rgba(22, 14, 42, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(167, 139, 250, 0.15)",
          borderRadius: 20,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2 className="font-heading text-2xl font-bold text-center">Paused</h2>

        {confirmQuit ? (
          <>
            <p className="text-sm text-center" style={{ color: "var(--white-muted)" }}>
              Are you sure you want to exit?
            </p>
            <div className="space-y-3">
              <button
                onClick={onQuit}
                className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-white bg-pink-accent/20 border-2 border-pink-accent transition-all hover:-translate-y-0.5"
              >
                Quit
              </button>
              <button
                onClick={() => setConfirmQuit(false)}
                className="w-full h-10 rounded-pill font-body text-sm text-white/70 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <button
              onClick={onResume}
              className="w-full h-10 rounded-pill font-heading text-xs font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
                boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
              }}
            >
              Resume
            </button>
            <button
              onClick={() => setShowHowToPlay(true)}
              className="w-full h-10 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "rgba(255, 255, 255, 0.7)",
              }}
            >
              How to Play
            </button>
            <p className="text-center text-xs font-body" style={{ color: "var(--ws-text-muted)" }}>
              Progress saved automatically
            </p>
            <button
              onClick={() => setConfirmQuit(true)}
              className="w-full h-10 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              Exit Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
