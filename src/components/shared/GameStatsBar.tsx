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
        background: "rgba(22, 14, 42, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(167, 139, 250, 0.15)",
      }}
    >
      {/* Score */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="inline-flex items-center gap-1.5 text-gold-primary">
          <Star className="w-4 h-4" fill="currentColor" />
          <span className="font-grid text-sm font-semibold">{displayScore}</span>
        </div>
        <span className="font-ws-mono text-[9px] uppercase tracking-wider text-white/35">Score</span>
      </div>

      {/* Lives */}
      <div className="flex flex-col items-center gap-0.5">
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
        <span className="font-ws-mono text-[9px] uppercase tracking-wider text-white/35">Lives</span>
      </div>

      {/* Hints used */}
      <div className="flex flex-col items-center gap-0.5">
        <div className="inline-flex items-center gap-1.5 text-white/60">
          <Zap className="w-4 h-4" />
          <span className="font-grid text-sm">{hintsUsed}</span>
        </div>
        <span className="font-ws-mono text-[9px] uppercase tracking-wider text-white/35">Hints</span>
      </div>

      {/* Timer */}
      <div className="flex flex-col items-center gap-0.5">
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
        <span className="font-ws-mono text-[9px] uppercase tracking-wider text-white/35">Time</span>
      </div>
    </div>
  );
}
