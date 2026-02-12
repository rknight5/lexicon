"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, BarChart2, Bookmark } from "lucide-react";
import { ConfigScreen } from "@/components/shared/ConfigScreen";
import { StatsModal } from "@/components/shared/StatsModal";
import { ResumeCard } from "@/components/shared/ResumeCard";
import { getAutoSave, deleteAutoSave, getSavedPuzzles, savePuzzle, type AutoSaveSummary } from "@/lib/storage";
import type { CategorySuggestion } from "@/lib/types";

const EXAMPLE_TOPICS = [
  "80s Rock",
  "Italian Cuisine",
  "Marvel Universe",
  "Ancient Egypt",
  "Dog Breeds",
  "Space Exploration",
];

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [prefetchedCategories, setPrefetchedCategories] = useState<CategorySuggestion[] | null>(null);
  const prefetchTopicRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [autoSave, setAutoSave] = useState<AutoSaveSummary | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    // Check sessionStorage first for instant resume after SPA navigation
    // (the async server save may still be in-flight)
    const pending = sessionStorage.getItem("lexicon-pending-autosave");
    if (pending) {
      try {
        setAutoSave(JSON.parse(pending));
      } catch { /* ignore corrupt data */ }
      sessionStorage.removeItem("lexicon-pending-autosave");
    }
    // Also fetch from server (authoritative, covers tab-close saves)
    getAutoSave().then(setAutoSave).catch(() => {});
    getSavedPuzzles().then((p) => setSavedCount(p.length)).catch(() => {});
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

  const handleResume = () => {
    if (!autoSave) return;

    const storageKey =
      autoSave.gameType === "crossword"
        ? "lexicon-puzzle-crossword"
        : autoSave.gameType === "anagram"
          ? "lexicon-puzzle-anagram"
          : "lexicon-puzzle";

    const route =
      autoSave.gameType === "crossword"
        ? "/puzzle/crossword"
        : autoSave.gameType === "anagram"
          ? "/puzzle/anagram"
          : "/puzzle/wordsearch";

    sessionStorage.setItem(storageKey, JSON.stringify(autoSave.puzzleData));
    sessionStorage.setItem("lexicon-game-state", JSON.stringify(autoSave.gameState));
    router.push(route);
  };

  const handleSaveAutoSave = async (): Promise<boolean> => {
    if (!autoSave) return false;
    const result = await savePuzzle(
      autoSave.gameType,
      autoSave.title,
      autoSave.difficulty,
      autoSave.puzzleData
    );
    return !!result.id;
  };

  const handleDismissResume = async () => {
    await deleteAutoSave();
    setAutoSave(null);
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
      <div className="absolute top-6 right-6 flex items-center gap-5">
        <button
          onClick={() => router.push("/saved")}
          className="relative text-white/50 hover:text-white/80 transition-colors p-2 -m-2"
          title="Saved puzzles"
        >
          <Bookmark className="w-6 h-6" />
          {savedCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-gold-primary" />
          )}
        </button>
        <button
          onClick={() => setShowStats(true)}
          className="text-white/50 hover:text-white/80 transition-colors p-2 -m-2"
          title="Stats"
        >
          <BarChart2 className="w-6 h-6" />
        </button>
        <button
          onClick={handleLogout}
          className="text-white/50 hover:text-white/80 transition-colors p-2 -m-2"
          title="Log out"
        >
          <LogOut className="w-6 h-6" />
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
          className="w-full h-[52px] px-5 rounded-2xl text-base font-body text-white placeholder:text-white/50 outline-none transition-all"
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

      {/* Resume Card (replaces Quick Starts when auto-save exists) */}
      {autoSave ? (
        <div className="flex flex-col items-center mt-16 gap-4 w-full max-w-xl">
          <div className="flex items-center gap-3 w-full">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-[11px] uppercase tracking-[2px] text-white/50 font-heading font-semibold whitespace-nowrap">Resume Game</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>
          <ResumeCard
            autoSave={autoSave}
            onResume={handleResume}
            onSave={handleSaveAutoSave}
            onDismiss={handleDismissResume}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center mt-10 gap-4 w-full max-w-md">
          <div className="flex items-center gap-3 w-full">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-[11px] uppercase tracking-[2px] text-white/50 font-heading font-semibold whitespace-nowrap">Quick Starts</span>
            <div className="h-px flex-1 bg-white/15" />
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
      )}

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </main>
  );
}
