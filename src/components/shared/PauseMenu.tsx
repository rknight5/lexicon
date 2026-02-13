"use client";

import { useState } from "react";
import { ModalShell } from "@/components/shared/ModalShell";

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  const [confirmQuit, setConfirmQuit] = useState(false);

  return (
    <ModalShell>
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
              className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
                boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
              }}
            >
              Resume
            </button>
            <p className="text-center text-white/60 text-xs font-body">
              Progress saved automatically
            </p>
            <button
              onClick={() => setConfirmQuit(true)}
              className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all"
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
                color: "var(--white-muted)",
              }}
            >
              Exit Game
            </button>
          </div>
        )}
    </ModalShell>
  );
}
