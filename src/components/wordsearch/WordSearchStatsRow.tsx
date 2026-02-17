"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface WordSearchStatsRowProps {
  livesRemaining: number;
  score: number;
  lastMissTimestamp?: number;
}

export function WordSearchStatsRow({
  livesRemaining,
  score,
  lastMissTimestamp = 0,
}: WordSearchStatsRowProps) {
  const [heartBreaking, setHeartBreaking] = useState(false);
  const prevLives = useRef(livesRemaining);
  const [displayScore, setDisplayScore] = useState(score);
  const animRef = useRef<number>(0);

  const animateScore = useCallback((from: number, to: number) => {
    cancelAnimationFrame(animRef.current);
    const start = performance.now();
    const duration = 400;
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) * (1 - t); // ease-out quad
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

  useEffect(() => {
    prevLives.current = livesRemaining;
  }, [livesRemaining]);

  return (
    <div
      className="flex items-center justify-between"
      style={{ padding: "0 18px 8px" }}
    >
      {/* Hearts */}
      <div className="flex items-center" style={{ gap: 4 }}>
        {[0, 1, 2].map((i) => {
          const filled = i < livesRemaining;
          const breaking = heartBreaking && i === livesRemaining;

          return (
            <svg
              key={i}
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={filled ? "#ff4d6a" : "none"}
              stroke={filled ? "#ff4d6a" : "rgba(255, 255, 255, 0.15)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-all ${breaking ? "animate-heart-break" : ""}`}
            >
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          );
        })}
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5">
        <span
          style={{
            fontFamily: "var(--font-ws-mono)",
            fontSize: 10,
            fontWeight: 400,
            color: "var(--ws-text-dim)",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          PTS
        </span>
        <span
          style={{
            fontFamily: "var(--font-ws-mono)",
            fontSize: 13,
            fontWeight: 700,
            color: "#f7c948",
          }}
        >
          {displayScore}
        </span>
      </div>
    </div>
  );
}
