"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Shield, Flame, Skull, Sparkles, Search, Grid3X3, Shuffle, Brain, Info, Check } from "lucide-react";
import type { Difficulty, GameType, CategorySuggestion } from "@/lib/types";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { STORAGE_KEYS, puzzleKeyForGameType } from "@/lib/storage-keys";
import { isProfane } from "@/lib/content-filter";

interface ConfigScreenProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  onBack: () => void;
  prefetchedCategories?: CategorySuggestion[] | null;
  initialDifficulty?: Difficulty;
  initialGameType?: GameType;
  initialFocusCategories?: string[];
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
    description: "Horizontal & vertical only",
    icon: <Shield className="w-5 h-5" />,
    color: "text-green-accent",
  },
  {
    value: "medium",
    label: "Medium",
    description: "All 8 directions",
    icon: <Flame className="w-5 h-5" />,
    color: "text-gold-primary",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Deep cuts included",
    icon: <Skull className="w-5 h-5" />,
    color: "text-pink-accent",
  },
];

export function ConfigScreen({ topic, onTopicChange, onBack, prefetchedCategories, initialDifficulty, initialGameType, initialFocusCategories }: ConfigScreenProps) {
  const router = useRouter();
  const [gameType, setGameType] = useState<GameType>(initialGameType ?? "wordsearch");
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty ?? "medium");
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRetryable, setErrorRetryable] = useState(true);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [shakeInput, setShakeInput] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const initialFocusCategoriesRef = useRef(initialFocusCategories ?? null);

  async function fetchCategories(signal?: AbortSignal) {
    setLoadingCategories(true);
    setCategoryError(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
        credentials: "include",
        signal,
      });
      if (res.status === 422) {
        // Topic blocked by server-side profanity check
        setTopicError("This topic isn't available. Try something else.");
        setShakeInput(true);
        setTimeout(() => setShakeInput(false), 300);
        setCategories([]);
        return;
      }
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (signal?.aborted) return;
      if (data.categories && data.categories.length > 0) {
        setCategories(data.categories);
        if (initialFocusCategoriesRef.current && initialFocusCategoriesRef.current.length > 0) {
          const validNames = new Set(data.categories.map((c: CategorySuggestion) => c.name));
          const restored = initialFocusCategoriesRef.current.filter((name: string) => validNames.has(name));
          setSelectedCategories(restored.length >= 2 ? restored : []);
          initialFocusCategoriesRef.current = null;
        } else {
          setSelectedCategories([]);
        }
      } else {
        setCategoryError(true);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setCategories([]);
      setCategoryError(true);
    } finally {
      if (!signal?.aborted) setLoadingCategories(false);
    }
  }

  // Use prefetched categories if available, otherwise fetch once on mount
  const hasFetchedRef = useRef(false);
  useEffect(() => {
    if (prefetchedCategories && prefetchedCategories.length > 0) {
      setCategories(prefetchedCategories);
      if (initialFocusCategoriesRef.current && initialFocusCategoriesRef.current.length > 0) {
        const validNames = new Set(prefetchedCategories.map((c) => c.name));
        const restored = initialFocusCategoriesRef.current.filter((name: string) => validNames.has(name));
        setSelectedCategories(restored.length >= 2 ? restored : []);
        initialFocusCategoriesRef.current = null;
      } else {
        setSelectedCategories([]);
      }
      setLoadingCategories(false);
      hasFetchedRef.current = true;
      return;
    }

    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const controller = new AbortController();
    fetchCategories(controller.signal);
    return () => controller.abort();
  }, [prefetchedCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch categories when topic changes (debounced)
  const mountedRef = useRef(false);
  const refetchRef = useRef<AbortController | null>(null);
  useEffect(() => {
    // Skip the initial mount render (handled by the effect above)
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    // Abort any in-flight refetch from a previous keystroke
    refetchRef.current?.abort();

    if (!topic.trim()) {
      setCategories([]);
      setSelectedCategories([]);
      setLoadingCategories(false);
      setCategoryError(false);
      return;
    }

    setLoadingCategories(true);

    const timer = setTimeout(() => {
      if (isProfane(topic)) {
        setTopicError("This topic isn't available. Try something else.");
        setShakeInput(true);
        setTimeout(() => setShakeInput(false), 300);
        setCategories([]);
        setLoadingCategories(false);
        return;
      }
      const controller = new AbortController();
      refetchRef.current = controller;
      fetchCategories(controller.signal);
    }, 600);

    return () => clearTimeout(timer);
  }, [topic]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch daily generation remaining count
  useEffect(() => {
    fetch("/api/generate/remaining", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setRemaining(data.remaining);
          setLimitReached(data.remaining <= 0);
        }
      })
      .catch(() => {});
  }, []);

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const handleGenerate = async () => {
    if (selectedCategories.length < 2) return;
    if (isProfane(topic)) {
      setTopicError("This topic isn't available. Try something else.");
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 300);
      return;
    }
    setGenerating(true);
    setError(null);
    setErrorRetryable(true);
    cancelledRef.current = false;

    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      timeout = setTimeout(() => controller.abort(), 60000);
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
        if (res.status === 422) {
          setErrorRetryable(false);
        }
        if (res.status === 429 && data.remaining === 0) {
          setRemaining(0);
          setLimitReached(true);
          setGenerating(false);
          abortRef.current = null;
          return;
        }
        throw new Error(data.error || "Failed to generate puzzle");
      }

      const puzzle = await res.json();

      // Update remaining count from response metadata
      if (puzzle._meta) {
        setRemaining(puzzle._meta.remaining);
        setLimitReached(puzzle._meta.remaining <= 0);
      }

      // Strip _meta before storing
      const { _meta, ...puzzleData } = puzzle;

      // Store puzzle in sessionStorage and navigate
      const storageKey = puzzleKeyForGameType(gameType);

      const route = gameType === "crossword"
        ? "/puzzle/crossword"
        : gameType === "anagram"
          ? "/puzzle/anagram"
          : gameType === "trivia"
            ? "/puzzle/trivia"
            : "/puzzle/wordsearch";
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(puzzleData));
        sessionStorage.setItem(
          STORAGE_KEYS.PUZZLE_CONFIG,
          JSON.stringify({ topic, difficulty, gameType, focusCategories: selectedCategories, categories })
        );
      } catch {
        // sessionStorage may be unavailable in private browsing
        throw new Error("Unable to save puzzle data. Try disabling private browsing.");
      }
      router.push(route);
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof DOMException && err.name === "AbortError") {
        if (!cancelledRef.current) {
          setError("Generation timed out. Try a simpler topic or lower difficulty.");
        }
      } else if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError("No internet connection. Check your network and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong — try again");
      }
      // Only reset on error — on success, keep LoadingOverlay visible until navigation completes
      setGenerating(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    abortRef.current?.abort();
    setGenerating(false);
  };

  if (generating) {
    return <LoadingOverlay onCancel={handleCancel} />;
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--ws-bg)" }}>
      {/* ── Header bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "var(--ws-header-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          paddingTop: "env(safe-area-inset-top, 40px)",
        }}
      >
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: "48px 1fr 48px",
            padding: "10px 14px",
          }}
        >
          <button
            onClick={onBack}
            className="flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80 active:scale-95"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.08)",
            }}
          >
            <X style={{ width: 18, height: 18, color: "rgba(255, 255, 255, 0.7)" }} />
          </button>
          <span
            className="text-center font-heading font-semibold text-white"
            style={{ fontSize: 15 }}
          >
            Create Puzzle
          </span>
          <div />
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div style={{ paddingTop: "calc(env(safe-area-inset-top, 40px) + 56px + 16px)" }} />

      {/* ── Scrollable content ── */}
      <div
        className="flex-1 overflow-y-auto px-5"
        style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 34px) + 16px)" }}
      >
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Topic input */}
          <div>
            <label className="block font-heading text-sm mb-2 text-white/70">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                onTopicChange(e.target.value.slice(0, 200));
                if (topicError) setTopicError(null);
              }}
              className={`w-full h-11 px-4 rounded-xl text-base font-body text-white placeholder:text-white/50 outline-none transition-all${shakeInput ? " animate-shake" : ""}`}
              style={{
                background: "var(--glass-bg)",
                border: "1px solid var(--glass-border)",
              }}
            />
            {topicError && (
              <p className="font-body" style={{ fontSize: 13, color: "rgba(255, 77, 106, 0.8)", marginTop: 6 }}>
                {topicError}
              </p>
            )}
            {/* Tip card */}
            <div
              className="flex items-start gap-2.5 mt-3 px-3 py-2.5 rounded-xl"
              style={{
                background: "rgba(167, 139, 250, 0.06)",
                border: "1px solid rgba(167, 139, 250, 0.15)",
              }}
            >
              <Info
                className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                style={{ color: "rgba(167, 139, 250, 0.6)" }}
              />
              <p className="text-xs font-body" style={{ color: "var(--ws-text-muted)", lineHeight: 1.5 }}>
                If your topic is very niche, we may broaden it to include
                related terms to build a great puzzle.
              </p>
            </div>
          </div>

          {/* Game Type — taller cards */}
          <div>
            <label className="block font-heading text-sm mb-3 text-white/70">
              Game Type
            </label>
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              {([
                { value: "wordsearch" as GameType, label: "Word Search", desc: "Find hidden words in a grid", icon: <Search className="w-7 h-7" /> },
                { value: "crossword" as GameType, label: "Crossword", desc: "Solve clues in a mini grid", icon: <Grid3X3 className="w-7 h-7" /> },
                { value: "anagram" as GameType, label: "Anagram", desc: "Unscramble jumbled words", icon: <Shuffle className="w-7 h-7" /> },
                { value: "trivia" as GameType, label: "Trivia", desc: "Answer topic-based questions", icon: <Brain className="w-7 h-7" /> },
              ]).map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGameType(g.value)}
                  className="flex flex-col items-center justify-center rounded-2xl text-center transition-all"
                  style={{
                    minHeight: 130,
                    padding: "16px 8px",
                    background: gameType === g.value ? "rgba(255, 215, 0, 0.1)" : "var(--glass-bg)",
                    border: gameType === g.value ? "2px solid #FFD700" : "1px solid var(--glass-border)",
                  }}
                >
                  <div className="text-gold-primary mb-3">{g.icon}</div>
                  <div className="font-heading text-sm font-bold">{g.label}</div>
                  <div className="text-[10px] mt-1.5 leading-tight" style={{ color: "var(--ws-text-muted)" }}>
                    {g.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty — compact cards */}
          <div>
            <label className="block font-heading text-sm mb-3 text-white/70">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className="flex flex-col items-center justify-center rounded-2xl text-center transition-all"
                  style={{
                    minHeight: 90,
                    padding: "10px 6px",
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
                  <div className={`${opt.color} mb-1.5`}>{opt.icon}</div>
                  <div className="font-heading text-sm font-bold">
                    {opt.label}
                  </div>
                  <div
                    className="mt-1 leading-tight"
                    style={{ fontSize: 9, color: "var(--ws-text-muted)" }}
                  >
                    {opt.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Focus Areas — 2-column pill grid */}
          <div>
            <label className="block font-heading text-sm mb-3 text-white/70">
              Focus Areas
            </label>
            {loadingCategories ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <svg
                  className="animate-spin"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span className="text-xs font-body" style={{ color: "var(--ws-text-muted)" }}>
                  Loading focus areas...
                </span>
              </div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => toggleCategory(cat.name)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[13px] font-body font-semibold transition-all text-left"
                      style={{
                        background: isSelected
                          ? "rgba(247, 201, 72, 0.1)"
                          : "rgba(255, 255, 255, 0.04)",
                        border: isSelected
                          ? "1px solid rgba(247, 201, 72, 0.4)"
                          : "1px solid rgba(255, 255, 255, 0.08)",
                        color: isSelected ? "#f7c948" : "var(--ws-text-muted)",
                      }}
                      title={cat.description}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#f7c948" }} />
                      )}
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            ) : categoryError ? (
              <div className="flex items-center gap-3">
                <p className="text-sm" style={{ color: "var(--color-pink-accent)" }}>
                  Couldn&apos;t load categories.
                </p>
                <button
                  onClick={() => fetchCategories()}
                  className="text-sm font-heading font-bold underline"
                  style={{ color: "var(--color-gold-primary)" }}
                >
                  Retry
                </button>
              </div>
            ) : categories.length === 0 && !loadingCategories ? (
              <p className="text-sm" style={{ color: "rgba(255, 77, 106, 0.8)" }}>
                Couldn&apos;t find suitable categories. Try a different topic.
              </p>
            ) : (
              <p className="text-sm" style={{ color: "var(--ws-text-muted)" }}>
                Categories will be auto-selected based on your topic.
              </p>
            )}

            {selectedCategories.length < 2 && categories.length > 0 && (
              <p className="text-sm text-pink-accent mt-2">
                Select at least 2 categories
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between gap-3 text-sm text-pink-accent bg-pink-accent/10 p-3 rounded-xl">
              <p>{error}</p>
              {errorRetryable && (
                <button
                  onClick={handleGenerate}
                  className="shrink-0 font-heading font-bold underline"
                  style={{ color: "var(--color-gold-primary)" }}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Pinned Generate button ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 34px)",
        }}
      >
        {/* Gradient fade */}
        <div
          style={{
            height: 40,
            background: "linear-gradient(to bottom, transparent, var(--ws-bg))",
            pointerEvents: "none",
          }}
        />
        <div
          className="px-5 pb-3"
          style={{ background: "var(--ws-bg)" }}
        >
          <button
            onClick={handleGenerate}
            disabled={
              generating ||
              selectedCategories.length < 2 ||
              !topic.trim() ||
              limitReached
            }
            className="w-full max-w-md mx-auto flex items-center justify-center gap-2 h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed active:enabled:scale-[0.97]"
            style={{
              background: limitReached
                ? "rgba(255, 255, 255, 0.12)"
                : "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              boxShadow: limitReached ? "none" : "0 4px 15px rgba(255, 215, 0, 0.4)",
              color: limitReached ? "rgba(255, 255, 255, 0.4)" : "#1a0a2e",
            }}
          >
            {generating ? (
              <span className="animate-pulse">Generating...</span>
            ) : limitReached ? (
              "Daily Limit Reached"
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Puzzle
              </>
            )}
          </button>
          {limitReached ? (
            <p
              className="text-center font-body mt-2 max-w-md mx-auto"
              style={{ fontSize: 12, color: "var(--ws-text-muted)" }}
            >
              You&apos;ve used all 10 puzzles for today. Come back tomorrow!
            </p>
          ) : remaining !== null ? (
            <p
              className="text-center font-body mt-2 max-w-md mx-auto"
              style={{ fontSize: 12, color: "var(--ws-text-muted)" }}
            >
              {remaining} of 10 puzzles remaining today
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
