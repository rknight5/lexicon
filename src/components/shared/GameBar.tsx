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
}

const DIFFICULTY_BADGE: Record<
  Difficulty,
  { label: string; icon: React.ReactNode; className: string }
> = {
  easy: {
    label: "Easy",
    icon: <Shield className="w-4 h-4" />,
    className: "text-green-accent border-green-accent/30 bg-green-accent/10",
  },
  medium: {
    label: "Medium",
    icon: <Flame className="w-4 h-4" />,
    className: "text-gold-primary border-gold-primary/30 bg-gold-primary/10",
  },
  hard: {
    label: "Hard",
    icon: <Skull className="w-4 h-4" />,
    className: "text-pink-accent border-pink-accent/30 bg-pink-accent/10",
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
}: GameBarProps) {
  const router = useRouter();
  const badge = DIFFICULTY_BADGE[difficulty];
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
      className="h-14 px-5 flex items-center border-b relative"
      style={{
        background: "#1A0A2E",
        borderColor: "rgba(255, 255, 255, 0.08)",
      }}
    >
      {/* Left: back button */}
      <button
        onClick={onBack}
        className="relative z-10 flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
      >
        <Home className="w-6 h-6" />
      </button>

      {/* Center: title + difficulty badge */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
        {editing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); commitEdit(); }}
            className="flex items-center gap-1.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              maxLength={60}
              className="font-heading text-base font-bold bg-transparent border-b border-white/30 outline-none text-white text-center px-1 py-0.5"
              style={{ minWidth: "120px", maxWidth: "280px", width: `${Math.max(120, editValue.length * 9)}px` }}
            />
            <button
              type="submit"
              className="text-green-accent hover:text-green-accent/80 transition-colors p-0.5"
            >
              <Check className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1">
            <span className="font-heading text-base font-bold">{title}</span>
            {onTitleChange && (
              <button
                onClick={startEditing}
                className="text-white/50 hover:text-white/80 transition-colors p-0.5"
                title="Edit title"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        <div
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill border text-[11px] font-heading font-bold ${badge.className}`}
        >
          {badge.icon}
          {badge.label}
        </div>
      </div>

      {/* Right: save + stats + help + settings + logout */}
      <div className="ml-auto flex items-center gap-5 relative z-10">
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaved}
            className={`transition-colors p-2 -m-2 cursor-pointer ${isSaved ? "text-gold-primary cursor-default" : "text-white/50 hover:text-white/80"}`}
            title={isSaved ? "Saved" : "Save puzzle"}
          >
            <Bookmark className="w-6 h-6" fill={isSaved ? "currentColor" : "none"} />
          </button>
        )}
        <button
          onClick={onStats}
          className="text-white/50 hover:text-white/80 transition-colors p-2 -m-2"
          title="Stats"
        >
          <BarChart2 className="w-6 h-6" />
        </button>
        <button
          onClick={onPause}
          className="text-white/50 hover:text-white/80 transition-colors p-2 -m-2"
          title="Settings"
          disabled={gameStatus !== "playing"}
        >
          <Settings className="w-6 h-6" />
        </button>
        <button
          onClick={handleLogout}
          className="text-white/50 hover:text-white/80 transition-colors p-2 -m-2"
          title="Log out"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
