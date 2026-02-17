"use client";

import { useState, useEffect } from "react";
import { Copy, Share2, X } from "lucide-react";
import { shareOrCopy } from "@/lib/share";

interface ShareSheetProps {
  text: string;
  onClose: () => void;
  onToast: (message: string) => void;
}

export function ShareSheet({ text, onClose, onToast }: ShareSheetProps) {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    onToast("Copied!");
    onClose();
  };

  const handleShare = async () => {
    const result = await shareOrCopy(text);
    if (result === "copied") {
      onToast("Copied!");
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: "rgba(0, 0, 0, 0.4)" }} />

      {/* Bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col items-center"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 34px) + 12px)",
          animation: "share-sheet-up 200ms ease-out",
        }}
      >
        <div
          className="w-full max-w-sm mx-4 p-4"
          style={{
            background: "rgba(22, 14, 42, 0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(167, 139, 250, 0.15)",
            borderRadius: 20,
            boxShadow: "0 -4px 32px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading text-sm font-bold text-white/80">
              Share Results
            </span>
            <button
              onClick={onClose}
              className="flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "rgba(255, 255, 255, 0.08)",
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preview */}
          <pre
            className="text-[11px] font-mono leading-snug mb-4 p-3 rounded-xl overflow-x-auto"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              color: "var(--ws-text-muted)",
              whiteSpace: "pre-wrap",
            }}
          >
            {text}
          </pre>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-pill font-heading text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
              style={{
                background: canShare ? "rgba(255, 255, 255, 0.06)" : "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
                border: canShare ? "1px solid rgba(255, 255, 255, 0.12)" : "none",
                color: canShare ? "rgba(255, 255, 255, 0.7)" : "#1a0a2e",
                boxShadow: canShare ? "none" : "0 4px 15px rgba(255, 215, 0, 0.4)",
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
            {canShare && (
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-pill font-heading text-xs font-bold uppercase tracking-wider text-purple-deep transition-all active:scale-[0.97]"
                style={{
                  background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
                  boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
                }}
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes share-sheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
