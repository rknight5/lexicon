"use client";

import { useState } from "react";

interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
  onSaveAndExit?: () => void;
  isSaving?: boolean;
}

export function PauseMenu({ onResume, onQuit, onSaveAndExit, isSaving }: PauseMenuProps) {
  const [confirmQuit, setConfirmQuit] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "var(--overlay-dark)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-card p-6 space-y-4"
        style={{
          background: "linear-gradient(135deg, #2D1B69 0%, #5B2D8E 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2 className="font-heading text-2xl font-bold text-center">Paused</h2>

        {confirmQuit ? (
          <>
            <p className="text-sm text-center" style={{ color: "var(--white-muted)" }}>
              Are you sure? Your progress will be lost.
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
                className="w-full h-10 rounded-pill font-body text-sm text-white/60 hover:text-white transition-colors"
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
            {onSaveAndExit && (
              <button
                onClick={onSaveAndExit}
                disabled={isSaving}
                className="w-full h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--white-muted)",
                }}
              >
                {isSaving ? "Saving..." : "Save & Exit"}
              </button>
            )}
            <button
              onClick={() => setConfirmQuit(true)}
              className="w-full h-10 rounded-pill font-body text-sm text-white/60 hover:text-white transition-colors"
            >
              Quit Without Saving
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
