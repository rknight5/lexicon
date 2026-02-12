"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, PauseCircle, Shield, Flame, Skull, ArrowLeft, Star, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@/lib/types";

interface GameBarProps {
  difficulty: Difficulty;
  livesRemaining: number;
  elapsedSeconds: number;
  score: number;
  onPause: () => void;
  onBack?: () => void;
  gameStatus: string;
  lastMissTimestamp?: number;
  title?: string;
}

const DIFFICULTY_BADGE: Record<
  Difficulty,
  { label: string; icon: React.ReactNode; className: string }
> = {
  easy: {
    label: "Easy",
    icon: <Shield className="w-3.5 h-3.5" />,
    className: "text-green-accent border-green-accent/30 bg-green-accent/10",
  },
  medium: {
    label: "Medium",
    icon: <Flame className="w-3.5 h-3.5" />,
    className: "text-gold-primary border-gold-primary/30 bg-gold-primary/10",
  },
  hard: {
    label: "Hard",
    icon: <Skull className="w-3.5 h-3.5" />,
    className: "text-pink-accent border-pink-accent/30 bg-pink-accent/10",
  },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function GameBar({
  difficulty,
  livesRemaining,
  elapsedSeconds,
  score,
  onPause,
  onBack,
  gameStatus,
  lastMissTimestamp = 0,
  title,
}: GameBarProps) {
  const router = useRouter();
  const badge = DIFFICULTY_BADGE[difficulty];
  const [heartBreaking, setHeartBreaking] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    if (lastMissTimestamp > 0) {
      setHeartBreaking(true);
      const t = setTimeout(() => setHeartBreaking(false), 300);
      return () => clearTimeout(t);
    }
  }, [lastMissTimestamp]);

  return (
    <div
      className="h-14 px-4 flex items-center border-b relative"
      style={{
        background: "rgba(26, 10, 46, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Left: back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="font-body text-sm">Back</span>
      </button>

      {/* Center: title + difficulty badge */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5">
        <span className="font-heading text-sm font-bold">{title}</span>
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill border text-[10px] font-heading font-bold ${badge.className}`}
        >
          {badge.icon}
          {badge.label}
        </div>
      </div>

      {/* Right: score + lives + timer + pause */}
      <div className="ml-auto flex items-center gap-5">
        {/* Score */}
        <div className="inline-flex items-center gap-1.5 text-gold-primary">
          <Star className="w-4 h-4" fill="currentColor" />
          <span className="font-grid text-sm font-semibold">{score}</span>
        </div>

        {/* Lives */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <Heart
              key={i}
              className={`w-4 h-4 transition-all ${
                i < livesRemaining
                  ? "text-red-400"
                  : "text-gray-600"
              } ${heartBreaking && i === livesRemaining ? "animate-heart-break" : ""}`}
              fill={i < livesRemaining ? "currentColor" : "none"}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="inline-flex items-center gap-1.5 text-white/60">
          <Clock className="w-4 h-4" />
          <span
            className={`font-grid text-sm ${
              gameStatus === "paused" ? "animate-pulse" : ""
            }`}
          >
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        {/* Pause */}
        <button
          onClick={onPause}
          className="text-white/60 hover:text-white transition-colors"
          disabled={gameStatus !== "playing"}
        >
          <PauseCircle className="w-6 h-6" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-white/30 hover:text-white/60 transition-colors p-1.5 -m-1.5"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
