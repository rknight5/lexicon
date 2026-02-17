"use client";

import { useState, useEffect } from "react";
import { BarChart2, Trophy, X } from "lucide-react";
import { getStats, type PlayerStats } from "@/lib/storage";
import { ModalShell } from "@/components/shared/ModalShell";

interface StatsModalProps {
  onClose: () => void;
}

export function StatsModal({ onClose }: StatsModalProps) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats().then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, []);

  const winRate =
    stats && stats.totalPuzzles > 0
      ? Math.round((stats.totalWins / stats.totalPuzzles) * 100)
      : 0;

  return (
    <ModalShell spaceY="space-y-5" onClickOutside={onClose} cardClassName="relative">
      {/* Close — rounded container */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <X className="w-4.5 h-4.5" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <BarChart2 className="w-6 h-6 text-gold-primary" />
        <h2 className="font-heading text-2xl font-bold text-gold-primary">
          Your Stats
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 rounded-2xl animate-pulse"
              style={{ background: "rgba(255, 255, 255, 0.05)" }}
            />
          ))}
        </div>
      ) : stats && stats.totalPuzzles > 0 ? (
        <>
          {/* Achievement row — Wins + Best Streak (larger, gold) */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Wins" value={stats.totalWins} size="large" gold />
            <StatCard
              label="Best Streak"
              value={stats.bestStreak}
              size="large"
              gold
              icon={
                stats.bestStreak > 0 ? (
                  <Trophy className="w-4 h-4 text-gold-primary" />
                ) : undefined
              }
            />
          </div>

          {/* Context row — Played + Current Streak (smaller, white) */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Played" value={stats.totalPuzzles} size="small" />
            <StatCard label="Streak" value={stats.currentStreak} size="small" />
          </div>

          {/* Win rate bar */}
          <div
            className="flex items-center gap-3 rounded-xl p-3"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <span className="font-grid text-lg font-bold text-gold-primary flex-shrink-0">
              {winRate}%
            </span>
            <div
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(255, 255, 255, 0.08)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(winRate, 2)}%`,
                  background: "linear-gradient(90deg, #a78bfa, #FFD700)",
                }}
              />
            </div>
            <span className="text-[10px] uppercase tracking-wider text-white/50 font-heading font-semibold flex-shrink-0">
              Win Rate
            </span>
          </div>

          {/* High Scores table */}
          <div>
            <span
              className="text-[10px] uppercase tracking-wider font-heading font-semibold block mb-2"
              style={{ color: "rgba(255, 255, 255, 0.45)" }}
            >
              High Scores
            </span>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Header row */}
              <div
                className="grid px-3 py-2"
                style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}
              >
                <div />
                {(["Easy", "Medium", "Hard"] as const).map((d) => (
                  <span
                    key={d}
                    className="text-center text-[9px] uppercase tracking-wider font-heading font-semibold"
                    style={{ color: "rgba(255, 255, 255, 0.4)" }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              {/* Data rows */}
              {([
                { label: "Word Search", key: "wordsearch" },
                { label: "Crossword", key: "crossword" },
                { label: "Anagram", key: "anagram" },
                { label: "Trivia", key: "trivia" },
              ] as const).map((game, idx) => (
                <div
                  key={game.key}
                  className="grid px-3 py-2"
                  style={{
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    borderTop: idx > 0 ? "1px solid rgba(255, 255, 255, 0.06)" : undefined,
                  }}
                >
                  <span
                    className="text-[11px] font-body font-semibold"
                    style={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    {game.label}
                  </span>
                  {(["easy", "medium", "hard"] as const).map((d) => {
                    const score = stats.bestScores[game.key]?.[d] ?? 0;
                    return (
                      <span
                        key={d}
                        className="text-center font-grid text-sm font-bold"
                        style={{
                          color: score > 0 ? "#FFD700" : "rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        {score > 0 ? score : "\u2014"}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <p
            className="font-body text-sm"
            style={{ color: "var(--white-muted)" }}
          >
            Play your first puzzle to see stats here!
          </p>
        </div>
      )}
    </ModalShell>
  );
}

function StatCard({
  label,
  value,
  icon,
  size = "large",
  gold = false,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  size?: "large" | "small";
  gold?: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="flex items-center justify-center gap-1.5">
        <span
          className="font-grid font-bold"
          style={{
            fontSize: size === "large" ? 32 : 28,
            color: gold ? "#FFD700" : "rgba(255, 255, 255, 0.9)",
          }}
        >
          {value}
        </span>
        {icon}
      </div>
      <span className="text-[10px] uppercase tracking-wider text-white/60 font-heading font-semibold">
        {label}
      </span>
    </div>
  );
}
