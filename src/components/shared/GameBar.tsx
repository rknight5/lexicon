"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, PauseCircle, Shield, Flame, Skull } from "lucide-react";
import type { Difficulty } from "@/lib/types";

interface GameBarProps {
  difficulty: Difficulty;
  livesRemaining: number;
  elapsedSeconds: number;
  onPause: () => void;
  gameStatus: string;
  lastMissTimestamp?: number;
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

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function GameBar({
  difficulty,
  livesRemaining,
  elapsedSeconds,
  onPause,
  gameStatus,
  lastMissTimestamp = 0,
}: GameBarProps) {
  const badge = DIFFICULTY_BADGE[difficulty];
  const [heartBreaking, setHeartBreaking] = useState(false);

  useEffect(() => {
    if (lastMissTimestamp > 0) {
      setHeartBreaking(true);
      const t = setTimeout(() => setHeartBreaking(false), 300);
      return () => clearTimeout(t);
    }
  }, [lastMissTimestamp]);

  return (
    <div
      className="h-14 px-4 flex items-center justify-between border-b"
      style={{
        background: "rgba(26, 10, 46, 0.9)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Left: placeholder for future best score */}
      <div className="w-20">
        <span className="font-body text-xs text-white/40">Best: —</span>
      </div>

      {/* Center: difficulty badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border text-xs font-heading font-bold ${badge.className}`}
      >
        {badge.icon}
        {badge.label}
      </div>

      {/* Right: lives + timer + pause */}
      <div className="flex items-center gap-4">
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
      </div>
    </div>
  );
}
