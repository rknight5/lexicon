"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Flame, Skull, Sparkles, Tag, Search, Grid3X3, Shuffle } from "lucide-react";
import type { Difficulty, GameType, CategorySuggestion } from "@/lib/types";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";

interface ConfigScreenProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  onBack: () => void;
  prefetchedCategories?: CategorySuggestion[] | null;
}

const DIFFICULTY_OPTIONS: {
  value: Difficulty;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "easy",
    label: "Easy",
    description: "12×12 grid, 10-12 words, horizontal & vertical",
    icon: <Shield className="w-6 h-6" />,
    color: "text-green-accent",
  },
  {
    value: "medium",
    label: "Medium",
    description: "15×15 grid, 15-18 words, all directions",
    icon: <Flame className="w-6 h-6" />,
    color: "text-gold-primary",
  },
  {
    value: "hard",
    label: "Hard",
    description: "18×18 grid, 18-22 words, deep cuts included",
    icon: <Skull className="w-6 h-6" />,
    color: "text-pink-accent",
  },
];

export function ConfigScreen({ topic, onTopicChange, onBack, prefetchedCategories }: ConfigScreenProps) {
  const router = useRouter();
  const [gameType, setGameType] = useState<GameType>("wordsearch");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use prefetched categories if available, otherwise fetch on mount
  useEffect(() => {
    if (prefetchedCategories && prefetchedCategories.length > 0) {
      setCategories(prefetchedCategories);
      setSelectedCategories(prefetchedCategories.map((c) => c.name));
      setLoadingCategories(false);
      return;
    }

    fetchCategories();
  }, [topic, prefetchedCategories]);

  async function fetchCategories() {
    setLoadingCategories(true);
    setCategoryError(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
        setSelectedCategories(data.categories.map((c: CategorySuggestion) => c.name));
      }
    } catch {
      setCategories([]);
      setCategoryError(true);
    } finally {
      setLoadingCategories(false);
    }
  }

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleGenerate = async () => {
    if (selectedCategories.length === 0) return;
    setGenerating(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          focusCategories: selectedCategories,
          gameType,
        }),
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate puzzle");
      }

      const puzzle = await res.json();
      // Store puzzle in sessionStorage and navigate
      const storageKey = gameType === "crossword"
        ? "lexicon-puzzle-crossword"
        : gameType === "anagram"
          ? "lexicon-puzzle-anagram"
          : "lexicon-puzzle";

      const route = gameType === "crossword"
        ? "/puzzle/crossword"
        : gameType === "anagram"
          ? "/puzzle/anagram"
          : "/puzzle/wordsearch";
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(puzzle));
      } catch {
        // sessionStorage may be unavailable in private browsing
        throw new Error("Unable to save puzzle data. Try disabling private browsing.");
      }
      router.push(route);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Generation timed out. Try a simpler topic or lower difficulty.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return <LoadingOverlay />;
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-5 pt-16 pb-8">
      {/* Back button — pinned top-left */}
      <button
        onClick={onBack}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 font-body text-sm"
        style={{ color: "var(--white-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-full max-w-md space-y-6">
        {/* Topic (editable) */}
        <div>
          <label className="block font-heading text-sm mb-2 text-white/70">
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value.slice(0, 200))}
            className="w-full h-11 px-4 rounded-xl text-base font-body text-white placeholder:text-white/50 outline-none transition-all"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
            }}
          />
          <p className="text-xs mt-2" style={{ color: "var(--white-muted)" }}>
            Tip: If your topic is very niche, we may broaden it to include
            related terms to build a great puzzle.
          </p>
        </div>

        {/* Game Type */}
        <div>
          <label className="block font-heading text-sm mb-3 text-white/70">
            Game Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setGameType("wordsearch")}
              className="p-4 rounded-2xl text-center transition-all"
              style={{
                background: gameType === "wordsearch" ? "rgba(255, 215, 0, 0.1)" : "var(--glass-bg)",
                border: gameType === "wordsearch" ? "2px solid #FFD700" : "1px solid var(--glass-border)",
              }}
            >
              <div className="text-gold-primary flex justify-center mb-2">
                <Search className="w-6 h-6" />
              </div>
              <div className="font-heading text-sm font-bold">Word Search</div>
              <div className="text-xs mt-1" style={{ color: "var(--white-muted)" }}>
                Find hidden words in a grid
              </div>
            </button>
            <button
              onClick={() => setGameType("crossword")}
              className="p-4 rounded-2xl text-center transition-all"
              style={{
                background: gameType === "crossword" ? "rgba(255, 215, 0, 0.1)" : "var(--glass-bg)",
                border: gameType === "crossword" ? "2px solid #FFD700" : "1px solid var(--glass-border)",
              }}
            >
              <div className="text-gold-primary flex justify-center mb-2">
                <Grid3X3 className="w-6 h-6" />
              </div>
              <div className="font-heading text-sm font-bold">Crossword</div>
              <div className="text-xs mt-1" style={{ color: "var(--white-muted)" }}>
                Solve clues in a mini grid
              </div>
            </button>
            <button
              onClick={() => setGameType("anagram")}
              className="p-4 rounded-2xl text-center transition-all"
              style={{
                background: gameType === "anagram" ? "rgba(255, 215, 0, 0.1)" : "var(--glass-bg)",
                border: gameType === "anagram" ? "2px solid #FFD700" : "1px solid var(--glass-border)",
              }}
            >
              <div className="text-gold-primary flex justify-center mb-2">
                <Shuffle className="w-6 h-6" />
              </div>
              <div className="font-heading text-sm font-bold">Anagram</div>
              <div className="text-xs mt-1" style={{ color: "var(--white-muted)" }}>
                Unscramble jumbled words
              </div>
            </button>
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block font-heading text-sm mb-3 text-white/70">
            Difficulty
          </label>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className={`p-4 rounded-2xl text-center transition-all ${
                  difficulty === opt.value
                    ? "scale-[1.02] border-gold-primary"
                    : ""
                }`}
                style={{
                  background:
                    difficulty === opt.value
                      ? "rgba(255, 215, 0, 0.1)"
                      : "var(--glass-bg)",
                  border:
                    difficulty === opt.value
                      ? "2px solid #FFD700"
                      : "1px solid var(--glass-border)",
                }}
              >
                <div
                  className={`${opt.color} flex justify-center mb-2`}
                >
                  {opt.icon}
                </div>
                <div className="font-heading text-sm font-bold">
                  {opt.label}
                </div>
                <div
                  className="text-xs mt-1"
                  style={{ color: "var(--white-muted)" }}
                >
                  {opt.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block font-heading text-sm mb-3 text-white/70">
            Focus Areas
          </label>
          {loadingCategories ? (
            <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-9 w-24 rounded-pill animate-pulse"
                  style={{ background: "var(--glass-bg)" }}
                />
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    onClick={() => toggleCategory(cat.name)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-body font-semibold transition-all"
                    style={{
                      background: isSelected
                        ? "rgba(255, 215, 0, 0.15)"
                        : "rgba(255, 255, 255, 0.1)",
                      border: isSelected
                        ? "1px solid #FFD700"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                      color: isSelected ? "#FFF0A0" : "var(--white-muted)",
                    }}
                    title={cat.description}
                  >
                    <Tag className="w-4 h-4" />
                    {cat.name}
                  </button>
                );
              })}
            </div>
          ) : categoryError ? (
            <div className="flex items-center gap-3">
              <p className="text-sm" style={{ color: "var(--color-pink-accent)" }}>
                Couldn't load categories.
              </p>
              <button
                onClick={fetchCategories}
                className="text-sm font-heading font-bold underline"
                style={{ color: "var(--color-gold-primary)" }}
              >
                Retry
              </button>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--white-muted)" }}>
              Categories will be auto-selected based on your topic.
            </p>
          )}

          {selectedCategories.length === 0 && categories.length > 0 && (
            <p className="text-sm text-pink-accent mt-2">
              Select at least one category
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-pink-accent bg-pink-accent/10 p-3 rounded-xl">
            {error}
          </p>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={
            generating ||
            selectedCategories.length === 0 ||
            !topic.trim()
          }
          className="w-full flex items-center justify-center gap-2 h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 active:enabled:scale-[0.97]"
          style={{
            background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
            boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
          }}
        >
          {generating ? (
            <span className="animate-pulse">Generating...</span>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Puzzle
            </>
          )}
        </button>
      </div>
    </main>
  );
}
