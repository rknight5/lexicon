"use client";

import { useState, useEffect } from "react";
import { Heart, Clock, Star, Lightbulb } from "lucide-react";

interface GameStatsBarProps {
  score: number;
  livesRemaining: number;
  hintsUsed: number;
  elapsedSeconds: number;
  gameStatus: string;
  lastMissTimestamp?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function GameStatsBar({
  score,
  livesRemaining,
  hintsUsed,
  elapsedSeconds,
  gameStatus,
  lastMissTimestamp = 0,
}: GameStatsBarProps) {
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
      className="inline-flex items-center justify-center gap-8 px-8 py-2.5 rounded-full"
      style={{
        background: "rgba(255, 255, 255, 0.06)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
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
              i < livesRemaining ? "text-red-400" : "text-gray-600"
            } ${heartBreaking && i === livesRemaining ? "animate-heart-break" : ""}`}
            fill={i < livesRemaining ? "currentColor" : "none"}
          />
        ))}
      </div>

      {/* Hints used */}
      <div className="inline-flex items-center gap-1.5 text-white/40">
        <Lightbulb className="w-4 h-4" />
        <span className="font-grid text-sm">{hintsUsed}</span>
      </div>

      {/* Timer */}
      <div className="inline-flex items-center gap-1.5 text-white/40">
        <Clock className="w-4 h-4" />
        <span
          className={`font-grid text-sm ${
            gameStatus === "paused" ? "animate-pulse" : ""
          }`}
        >
          {formatTime(elapsedSeconds)}
        </span>
      </div>
    </div>
  );
}
