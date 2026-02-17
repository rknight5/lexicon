"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, Flame, Skull, Home, Check, Bookmark } from "lucide-react";
import type { Difficulty } from "@/lib/types";

interface GameBarProps {
  difficulty: Difficulty;
  onPause: () => void;
  onBack?: () => void;
  gameStatus: string;
  title?: string;
  onTitleChange?: (newTitle: string) => void;
  onStats?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  onHint?: () => void;
  canHint?: boolean;
  hintsUsed?: number;
  onMenu?: () => void;
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; icon: React.ReactNode; className: string; color: string }
> = {
  easy: {
    label: "Easy",
    icon: <Shield className="w-4 h-4" />,
    className: "text-green-accent border-green-accent/30 bg-green-accent/10",
    color: "var(--color-green-accent)",
  },
  medium: {
    label: "Medium",
    icon: <Flame className="w-4 h-4" />,
    className: "text-gold-primary border-gold-primary/30 bg-gold-primary/10",
    color: "var(--color-gold-primary)",
  },
  hard: {
    label: "Hard",
    icon: <Skull className="w-4 h-4" />,
    className: "text-pink-accent border-pink-accent/30 bg-pink-accent/10",
    color: "var(--color-pink-accent)",
  },
};

export function GameBar({
  difficulty,
  onBack,
  title,
  onTitleChange,
  onSave,
  isSaved,
  onMenu,
}: GameBarProps) {
  const badge = DIFFICULTY_CONFIG[difficulty];
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = () => {
    setEditValue(title || "");
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title && onTitleChange) {
      onTitleChange(trimmed);
    }
    setEditing(false);
  };

  return (
    <div
      className="px-4 py-2 border-b"
      style={{
        background: "var(--ws-header-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: "80px 1fr 80px",
          padding: "4px 0",
        }}
      >
        {/* Left — Home button in container */}
        <div className="flex justify-start">
          <button
            onClick={onBack}
            className="flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:scale-95"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.08)",
            }}
          >
            <Home style={{ width: 19, height: 19, color: "rgba(255, 255, 255, 0.7)" }} />
          </button>
        </div>

        {/* Center — Title + pencil + difficulty badge */}
        <div className="flex items-center justify-center min-w-0 gap-2">
          {editing ? (
            <form
              onSubmit={(e) => { e.preventDefault(); commitEdit(); }}
              className="flex items-center gap-1.5 min-w-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                maxLength={60}
                className="bg-transparent border-b text-center text-white outline-none w-full max-w-[200px]"
                style={{
                  fontFamily: "var(--font-ws-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  borderColor: "rgba(255, 255, 255, 0.3)",
                }}
              />
              <button
                type="submit"
                className="flex-shrink-0 text-green-accent hover:text-green-accent/80 transition-colors p-0.5"
              >
                <Check className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={onTitleChange ? startEditing : undefined}
              className="flex items-center min-w-0 cursor-pointer"
              style={{ gap: 4 }}
            >
              <span
                className="text-white truncate"
                style={{
                  fontFamily: "var(--font-ws-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  minWidth: 0,
                }}
              >
                {title}
              </span>
              {onTitleChange && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                  style={{ alignSelf: "flex-start", marginTop: 1 }}
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              )}
            </button>
          )}
          <div
            className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-pill border text-[11px] font-heading font-bold ${badge.className}`}
          >
            {badge.icon}
            {badge.label}
          </div>
        </div>

        {/* Right — Save + Hamburger in containers */}
        <div className="flex items-center justify-end gap-2">
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaved}
              className="flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:scale-95 disabled:cursor-default"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: isSaved ? "rgba(255, 215, 0, 0.12)" : "rgba(255, 255, 255, 0.08)",
                border: isSaved ? "1px solid rgba(255, 215, 0, 0.18)" : "none",
              }}
              title={isSaved ? "Saved" : "Save puzzle"}
            >
              <Bookmark
                style={{
                  width: 16,
                  height: 16,
                  color: isSaved ? "#f7c948" : "rgba(255, 255, 255, 0.5)",
                }}
                fill={isSaved ? "currentColor" : "none"}
              />
            </button>
          )}
          {onMenu && (
            <button
              onClick={onMenu}
              className="flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:scale-95"
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.08)",
              }}
            >
              <div className="flex flex-col items-center justify-center" style={{ gap: "3.5px" }}>
                <span style={{ width: 16, height: 1.5, background: "rgba(255, 255, 255, 0.5)", borderRadius: 1 }} />
                <span style={{ width: 16, height: 1.5, background: "rgba(255, 255, 255, 0.5)", borderRadius: 1 }} />
                <span style={{ width: 16, height: 1.5, background: "rgba(255, 255, 255, 0.5)", borderRadius: 1 }} />
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
