"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, BarChart2, Search, Grid3X3, Shield, Flame, Skull, Shuffle, Trash2 } from "lucide-react";
import { ConfigScreen } from "@/components/shared/ConfigScreen";
import { StatsModal } from "@/components/shared/StatsModal";
import { getSavedPuzzles, loadSavedPuzzle, deleteSavedPuzzle, type SavedPuzzleSummary } from "@/lib/storage";
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

  const [activeTab, setActiveTab] = useState<"create" | "puzzles">("create");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

    const storageKey = loaded.gameType === "crossword"
      ? "lexicon-puzzle-crossword"
      : loaded.gameType === "anagram"
        ? "lexicon-puzzle-anagram"
        : "lexicon-puzzle";

    const route = loaded.gameType === "crossword"
      ? "/puzzle/crossword"
      : loaded.gameType === "anagram"
        ? "/puzzle/anagram"
        : "/puzzle/wordsearch";

    try {
      // Clear stale state from any previous puzzle load
      sessionStorage.removeItem("lexicon-game-state");

      sessionStorage.setItem(storageKey, JSON.stringify(loaded.puzzleData));
      sessionStorage.setItem("lexicon-saved-puzzle-id", puzzle.id);

      if (loaded.gameState) {
        sessionStorage.setItem("lexicon-game-state", JSON.stringify(loaded.gameState));
      }
    } catch {
      setLoadingPuzzleId(null);
      return;
    }
    router.push(route);
  };

  const handleDeletePuzzle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      const ok = await deleteSavedPuzzle(id);
      if (ok) {
        setSavedPuzzles((prev) => prev.filter((p) => p.id !== id));
      }
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-pill mb-8 w-full max-w-md"
           style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
        <button
          onClick={() => setActiveTab("create")}
          className="flex-1 py-2 rounded-pill font-heading text-sm font-bold transition-all"
          style={{
            background: activeTab === "create" ? "rgba(255, 215, 0, 0.15)" : "transparent",
            color: activeTab === "create" ? "#FFD700" : "var(--white-muted)",
          }}
        >
          Create
        </button>
        <button
          onClick={() => setActiveTab("puzzles")}
          className="flex-1 py-2 rounded-pill font-heading text-sm font-bold transition-all"
          style={{
            background: activeTab === "puzzles" ? "rgba(255, 215, 0, 0.15)" : "transparent",
            color: activeTab === "puzzles" ? "#FFD700" : "var(--white-muted)",
          }}
        >
          My Puzzles
        </button>
      </div>

      {activeTab === "create" && (
        <>
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
        </>
      )}

      {activeTab === "puzzles" && (
        <div className="w-full max-w-md" onClick={() => setDeletingId(null)}>
          {loadingSaved ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse"
                     style={{ background: "var(--glass-bg)" }} />
              ))}
            </div>
          ) : savedPuzzles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40 font-body mb-4">No saved puzzles yet</p>
              <button
                onClick={() => setActiveTab("create")}
                className="font-heading text-sm font-bold"
                style={{ color: "#FFD700" }}
              >
                Create your first puzzle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {savedPuzzles.map((puzzle) => (
                <button
                  key={puzzle.id}
                  onClick={() => handleLoadPuzzle(puzzle)}
                  disabled={loadingPuzzleId === puzzle.id}
                  className="w-full p-4 rounded-2xl text-left transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 flex items-center gap-4"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <div className="flex-shrink-0">
                    {puzzle.gameType === "crossword" ? (
                      <Grid3X3 className="w-5 h-5 text-white/40" />
                    ) : puzzle.gameType === "anagram" ? (
                      <Shuffle className="w-5 h-5 text-white/40" />
                    ) : (
                      <Search className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading text-sm font-bold text-white truncate">
                      {puzzle.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {DIFFICULTY_ICON[puzzle.difficulty]}
                      <span className="text-[11px] text-white/30 font-body">
                        {puzzle.gameType} · {timeAgo(puzzle.createdAt)}
                      </span>
                    </div>
                  </div>
                  {puzzle.hasGameState && (
                    <span className="text-[10px] uppercase tracking-wider font-heading font-bold px-2 py-1 rounded-pill flex-shrink-0"
                          style={{ background: "rgba(255, 215, 0, 0.15)", color: "#FFD700" }}>
                      In Progress
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDeletePuzzle(e, puzzle.id)}
                    className="flex-shrink-0 p-1.5 -m-1.5 transition-colors"
                    style={{ color: deletingId === puzzle.id ? "var(--color-pink-accent)" : "var(--white-muted)" }}
                    title={deletingId === puzzle.id ? "Click again to confirm" : "Delete puzzle"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </main>
  );
}
