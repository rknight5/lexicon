"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Heart, Timer, Zap, Star } from "lucide-react";
import { formatTime } from "@/lib/format";

interface GameStatsBarProps {
  score: number;
  livesRemaining: number;
  hintsUsed: number;
  elapsedSeconds: number;
  gameStatus: string;
  lastMissTimestamp?: number;
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
  const [displayScore, setDisplayScore] = useState(score);
  const animRef = useRef<number>(0);

  const animateScore = useCallback((from: number, to: number) => {
    cancelAnimationFrame(animRef.current);
    const start = performance.now();
    const duration = 400;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t);
      setDisplayScore(Math.round(from + (to - from) * eased));
      if (t < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (score !== displayScore) {
      animateScore(displayScore, score);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [score]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (lastMissTimestamp > 0) {
      setHeartBreaking(true);
      const t = setTimeout(() => setHeartBreaking(false), 200);
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
        <span className="font-grid text-sm font-semibold">{displayScore}</span>
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
      <div className="inline-flex items-center gap-1.5 text-white/60">
        <Zap className="w-4 h-4" />
        <span className="font-grid text-sm">{hintsUsed}</span>
      </div>

      {/* Timer */}
      <div className="inline-flex items-center gap-1.5 text-white/60">
        <Timer className="w-4 h-4" />
        <span
          className={`font-grid text-sm ${
            gameStatus === "paused" ? "animate-pulse" : ""
          }`}
        >
          {formatTime(elapsedSeconds, true)}
        </span>
      </div>
    </div>
  );
}
