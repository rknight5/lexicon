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
      className="h-10 px-6 flex items-center justify-center gap-8 border-b"
      style={{
        background: "rgba(26, 10, 46, 0.6)",
        borderColor: "rgba(255, 255, 255, 0.05)",
      }}
    >
      {/* Score */}
      <div className="inline-flex items-center gap-1.5 text-gold-primary">
        <Star className="w-3.5 h-3.5" fill="currentColor" />
        <span className="font-grid text-xs font-semibold">{score}</span>
      </div>

      {/* Lives */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <Heart
            key={i}
            className={`w-3.5 h-3.5 transition-all ${
              i < livesRemaining ? "text-red-400" : "text-gray-600"
            } ${heartBreaking && i === livesRemaining ? "animate-heart-break" : ""}`}
            fill={i < livesRemaining ? "currentColor" : "none"}
          />
        ))}
      </div>

      {/* Hints used */}
      <div className="inline-flex items-center gap-1.5 text-white/40">
        <Lightbulb className="w-3.5 h-3.5" />
        <span className="font-grid text-xs">{hintsUsed}</span>
      </div>

      {/* Timer */}
      <div className="inline-flex items-center gap-1.5 text-white/40">
        <Clock className="w-3.5 h-3.5" />
        <span
          className={`font-grid text-xs ${
            gameStatus === "paused" ? "animate-pulse" : ""
          }`}
        >
          {formatTime(elapsedSeconds)}
        </span>
      </div>
    </div>
  );
}
