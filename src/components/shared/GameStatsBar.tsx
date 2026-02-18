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
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(22, 14, 42, 0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        zIndex: 40,
      }}
    >
      <div className="flex items-center justify-center gap-8 px-6 py-2.5">
        {/* Score */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="inline-flex items-center gap-1.5 text-gold-primary">
            <Star style={{ width: 16, height: 16 }} fill="currentColor" />
            <span className="font-ws-mono text-[13px] font-bold text-white">{displayScore}</span>
          </div>
          <span className="font-ws-mono text-[9px] uppercase tracking-wider text-white/35">Score</span>
        </div>

        {/* Lives */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <Heart
                key={i}
                className={`transition-all ${
                  i < livesRemaining ? "text-red-400" : "text-gray-600"
                } ${heartBreaking && i === livesRemaining ? "animate-heart-break" : ""}`}
                style={{ width: 16, height: 16 }}
                fill={i < livesRemaining ? "currentColor" : "none"}
              />
            ))}
          </div>
          <span className="font-ws-mono text-[9px] uppercase tracking-wider text-white/35">Lives</span>
        </div>

        {/* Hints used */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="inline-flex items-center gap-1.5">
            <Zap style={{ width: 16, height: 16, color: "rgba(255, 255, 255, 0.6)" }} />
            <span className="font-ws-mono text-[13px] font-bold text-white">{hintsUsed}</span>
          </div>
          <span className="font-ws-mono text-[9px] uppercase tracking-wider text-white/35">Hints</span>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center gap-0.5">
          <div className="inline-flex items-center gap-1.5">
            <Timer style={{ width: 16, height: 16, color: "rgba(255, 255, 255, 0.6)" }} />
            <span
              className={`font-ws-mono text-[13px] font-bold text-white ${
                gameStatus === "paused" ? "animate-pulse" : ""
              }`}
            >
              {formatTime(elapsedSeconds, true)}
            </span>
          </div>
          <span className="font-ws-mono text-[9px] uppercase tracking-wider text-white/35">Time</span>
        </div>
      </div>
    </div>
  );
}
