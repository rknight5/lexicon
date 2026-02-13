"use client";

import { useState, useEffect } from "react";
import { BarChart2, Trophy, Flame, X } from "lucide-react";
import { getStats, type PlayerStats } from "@/lib/storage";

interface StatsModalProps {
  onClose: () => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-green-accent",
  medium: "text-gold-primary",
  hard: "text-pink-accent",
};

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: "var(--overlay-dark)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-card p-6 space-y-5 relative"
        style={{
          background: "linear-gradient(135deg, #2D1B69 0%, #5B2D8E 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white/80 transition-colors p-1 -m-1"
        >
          <X className="w-5 h-5" />
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
            {/* Overview grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Played" value={stats.totalPuzzles} />
              <StatCard label="Wins" value={stats.totalWins} />
              <StatCard
                label="Streak"
                value={stats.currentStreak}
                icon={
                  stats.currentStreak > 0 ? (
                    <Flame className="w-4 h-4 text-orange-400" />
                  ) : undefined
                }
              />
              <StatCard
                label="Best Streak"
                value={stats.bestStreak}
                icon={
                  stats.bestStreak > 0 ? (
                    <Trophy className="w-4 h-4 text-gold-primary" />
                  ) : undefined
                }
              />
            </div>

            {/* Win rate */}
            <div className="text-center">
              <span className="font-grid text-lg font-bold text-gold-primary">
                {winRate}%
              </span>
              <span className="text-xs text-white/60 font-body ml-1.5">
                win rate
              </span>
            </div>

            {/* Best scores */}
            <div className="space-y-3">
              <BestScoreSection
                title="Word Search"
                scores={stats.bestScores.wordsearch}
              />
              <BestScoreSection
                title="Crossword"
                scores={stats.bestScores.crossword}
              />
              <BestScoreSection
                title="Anagram"
                scores={stats.bestScores.anagram}
              />
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

        {/* Done button */}
        <button
          onClick={onClose}
          className="w-full h-11 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
          style={{
            background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
            boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
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
        <span className="font-grid text-2xl font-bold text-gold-primary">
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

function BestScoreSection({
  title,
  scores,
}: {
  title: string;
  scores: Record<string, number>;
}) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <span className="text-[10px] uppercase tracking-wider text-white/60 font-heading font-semibold">
        {title}
      </span>
      <div className="flex items-center justify-between mt-2">
        {(["easy", "medium", "hard"] as const).map((d) => (
          <div key={d} className="text-center flex-1">
            <span
              className={`font-grid text-sm font-bold ${DIFFICULTY_COLORS[d]}`}
            >
              {scores[d] > 0 ? scores[d] : "--"}
            </span>
            <div className="text-[9px] uppercase tracking-wider text-white/50 font-heading mt-0.5">
              {d}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
