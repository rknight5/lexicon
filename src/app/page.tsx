"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, BarChart2, Search, Grid3X3, Shield, Flame, Skull } from "lucide-react";
import { ConfigScreen } from "@/components/shared/ConfigScreen";
import { StatsModal } from "@/components/shared/StatsModal";
import { getSavedPuzzles, loadSavedPuzzle, type SavedPuzzleSummary } from "@/lib/storage";
import type { CategorySuggestion } from "@/lib/types";

const EXAMPLE_TOPICS = [
  "80s Rock",
  "Italian Cuisine",
  "Marvel Universe",
  "Ancient Egypt",
  "Dog Breeds",
  "Space Exploration",
];

const DIFFICULTY_ICON: Record<string, React.ReactNode> = {
  easy: <Shield className="w-3 h-3 text-green-accent" />,
  medium: <Flame className="w-3 h-3 text-gold-primary" />,
  hard: <Skull className="w-3 h-3 text-pink-accent" />,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [prefetchedCategories, setPrefetchedCategories] = useState<CategorySuggestion[] | null>(null);
  const prefetchTopicRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [savedPuzzles, setSavedPuzzles] = useState<SavedPuzzleSummary[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingPuzzleId, setLoadingPuzzleId] = useState<string | null>(null);

  useEffect(() => {
    getSavedPuzzles().then((puzzles) => {
      setSavedPuzzles(puzzles);
      setLoadingSaved(false);
    });
  }, []);

  // Prefetch categories as the user types (debounced 600ms)
  const prefetchCategories = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setPrefetchedCategories(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (prefetchTopicRef.current === value.trim()) return; // already fetched
      prefetchTopicRef.current = value.trim();
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: value.trim() }),
          credentials: "include",
        });
        const data = await res.json();
        if (data.categories && prefetchTopicRef.current === value.trim()) {
          setPrefetchedCategories(data.categories);
        }
      } catch {
        // Silently fail — ConfigScreen will fetch on its own
      }
    }, 600);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleTopicChange = (value: string) => {
    const trimmed = value.slice(0, 200);
    setTopic(trimmed);
    prefetchCategories(trimmed);
  };

  const handleSubmit = () => {
    if (!topic.trim()) return;
    setShowConfig(true);
  };

  const handleLoadPuzzle = async (puzzle: SavedPuzzleSummary) => {
    setLoadingPuzzleId(puzzle.id);
    const loaded = await loadSavedPuzzle(puzzle.id);
    if (!loaded) {
      setLoadingPuzzleId(null);
      return;
    }

    const storageKey = loaded.gameType === "crossword" ? "lexicon-puzzle-crossword" : "lexicon-puzzle";
    const route = loaded.gameType === "crossword" ? "/puzzle/crossword" : "/puzzle/wordsearch";

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(loaded.puzzleData));
    } catch {
      setLoadingPuzzleId(null);
      return;
    }
    router.push(route);
  };

  if (showConfig) {
    return (
      <ConfigScreen
        topic={topic}
        onTopicChange={setTopic}
        onBack={() => setShowConfig(false)}
        prefetchedCategories={prefetchTopicRef.current === topic.trim() ? prefetchedCategories : null}
      />
    );
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 pb-20 relative" style={{ paddingTop: "8vh" }}>
      {/* Top-right buttons */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button
          onClick={() => setShowStats(true)}
          className="text-white/30 hover:text-white/60 transition-colors p-1.5 -m-1.5"
          title="Stats"
        >
          <BarChart2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleLogout}
          className="text-white/30 hover:text-white/60 transition-colors p-1.5 -m-1.5"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Logo */}
      <h1 className="font-display text-5xl md:text-7xl tracking-[8px] mb-3"
          style={{
            color: "#F5D07A",
            textShadow: "0 0 30px rgba(245, 208, 122, 0.3)",
          }}>
        LEXICON
      </h1>

      {/* Tagline */}
      <p className="font-heading text-lg md:text-xl mb-8"
         style={{ color: "var(--white-muted)" }}>
        Turn your interests into word puzzles
      </p>

      {/* Topic Input */}
      <div className="w-full max-w-md mb-6">
        <input
          type="text"
          value={topic}
          onChange={(e) => handleTopicChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="What are you into? Try '90s grunge' or 'classic jazz piano'"
          className="w-full h-[52px] px-5 rounded-2xl text-base font-body text-white placeholder:text-white/40 outline-none transition-all"
          style={{
            background: "var(--glass-bg)",
            border: "2px solid var(--glass-border)",
          }}
          autoFocus
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleSubmit}
        disabled={!topic.trim()}
        className="flex items-center gap-2 h-12 px-8 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 active:enabled:scale-[0.97]"
        style={{
          background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
          boxShadow: topic.trim()
            ? "0 4px 15px rgba(255, 215, 0, 0.4)"
            : "none",
        }}
      >
        <Sparkles className="w-5 h-5" />
        Generate Puzzle
      </button>

      {/* Quick Starts */}
      <div className="flex flex-col items-center mt-10 gap-4 w-full max-w-md">
        <div className="flex items-center gap-3 w-full">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-[2px] text-white/30 font-heading font-semibold whitespace-nowrap">Quick Starts</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {EXAMPLE_TOPICS.map((example) => (
            <button
              key={example}
              onClick={() => {
                handleTopicChange(example);
              }}
              className="px-4 py-2 rounded-pill text-sm font-body font-semibold transition-all hover:border-gold-primary"
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "var(--white-muted)",
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Your Puzzles */}
      {!loadingSaved && savedPuzzles.length > 0 && (
        <div className="flex flex-col items-center mt-10 gap-4 w-full max-w-md">
          <div className="flex items-center gap-3 w-full">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-[2px] text-white/30 font-heading font-semibold whitespace-nowrap">Your Puzzles</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
            {savedPuzzles.slice(0, 6).map((puzzle) => (
              <button
                key={puzzle.id}
                onClick={() => handleLoadPuzzle(puzzle)}
                disabled={loadingPuzzleId === puzzle.id}
                className="p-3 rounded-2xl text-left transition-all hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-60"
                style={{
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  {puzzle.gameType === "crossword" ? (
                    <Grid3X3 className="w-3.5 h-3.5 text-white/40" />
                  ) : (
                    <Search className="w-3.5 h-3.5 text-white/40" />
                  )}
                  {DIFFICULTY_ICON[puzzle.difficulty]}
                </div>
                <div className="font-heading text-sm font-bold text-white truncate">
                  {puzzle.title}
                </div>
                <div className="text-[11px] text-white/30 font-body mt-1">
                  {timeAgo(puzzle.createdAt)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </main>
  );
}
