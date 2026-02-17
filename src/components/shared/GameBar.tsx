"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, Flame, Skull, Home, Pencil, Check, BarChart2, Bookmark, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
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
  onPause,
  onBack,
  gameStatus,
  title,
  onTitleChange,
  onStats,
  onSave,
  isSaved,
  onHint,
  canHint,
  hintsUsed = 0,
}: GameBarProps) {
  const router = useRouter();
  const badge = DIFFICULTY_CONFIG[difficulty];
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  };

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
      className="min-h-14 px-4 py-2 flex items-center gap-3 border-b"
      style={{
        background: "var(--ws-header-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Left: back button + difficulty (mobile) */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex-shrink-0 flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
        >
          <Home className="w-6 h-6" />
        </button>
        {/* Difficulty label (mobile only) */}
        <span className="lg:hidden flex items-center gap-1 text-xs font-heading font-bold p-1.5 -m-1.5" style={{ color: badge.color }}>
          {badge.icon}
          {badge.label}
        </span>
      </div>

      {/* Center: title + difficulty badge (desktop only) */}
      <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center gap-2">
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
              className="font-heading text-sm font-bold bg-transparent border-b border-white/30 outline-none text-white text-center px-1 py-0.5 min-w-0 w-full"
            />
            <button
              type="submit"
              className="flex-shrink-0 text-green-accent hover:text-green-accent/80 transition-colors p-0.5"
            >
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <span className="font-heading text-sm font-bold truncate">{title}</span>
        )}
        {!editing && onTitleChange && (
          <button
            onClick={startEditing}
            className="flex-shrink-0 text-white/50 hover:text-white/80 transition-colors p-0.5"
            title="Edit title"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <div
          className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-pill border text-[11px] font-heading font-bold ${badge.className}`}
        >
          {badge.icon}
          {badge.label}
        </div>
      </div>

      {/* Spacer on mobile (pushes icons right) */}
      <div className="flex-1 lg:hidden" />

      {/* Right: hint (mobile) + save + settings + logout */}
      <div className="flex-shrink-0 flex items-center gap-4">
        {onHint && (
          <button
            onClick={onHint}
            disabled={!canHint}
            className="lg:hidden relative text-gold-primary/70 hover:text-gold-primary transition-colors p-1.5 -m-1.5 disabled:opacity-30"
            title="Hint (costs 1 life)"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
            {hintsUsed > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gold-primary text-purple-deep text-[10px] font-bold flex items-center justify-center">
                {hintsUsed}
              </span>
            )}
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaved}
            className={`transition-colors p-1.5 -m-1.5 cursor-pointer ${isSaved ? "text-gold-primary cursor-default" : "text-white/50 hover:text-white/80"}`}
            title={isSaved ? "Saved" : "Save puzzle"}
          >
            <Bookmark className="w-6 h-6" fill={isSaved ? "currentColor" : "none"} />
          </button>
        )}
        <button
          onClick={onPause}
          className="text-white/50 hover:text-white/80 transition-colors p-1.5 -m-1.5"
          title="Settings"
          disabled={gameStatus !== "playing"}
        >
          <Settings className="w-6 h-6" />
        </button>
        <button
          onClick={handleLogout}
          className="text-white/50 hover:text-white/80 transition-colors p-1.5 -m-1.5"
          title="Log out"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
