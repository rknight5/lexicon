"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, BarChart2, Bookmark } from "lucide-react";
import { ConfigScreen } from "@/components/shared/ConfigScreen";
import { StatsModal } from "@/components/shared/StatsModal";
import { ResumeCard } from "@/components/shared/ResumeCard";
import { getAutoSaves, deleteAutoSave, savePuzzle, type AutoSaveSummary } from "@/lib/storage";
import type { CategorySuggestion, Difficulty, GameType } from "@/lib/types";
import { STORAGE_KEYS, puzzleKeyForGameType } from "@/lib/storage-keys";
import { isProfane } from "@/lib/content-filter";
import { Toast } from "@/components/shared/Toast";

const EXAMPLE_TOPICS = [
  "Classic Movies",
  "Italian Cuisine",
  "Marvel Universe",
  "Ancient Egypt",
  "Ocean Life",
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

  const [topicError, setTopicError] = useState<string | null>(null);
  const [shakeInput, setShakeInput] = useState(false);
  const [redirectToast, setRedirectToast] = useState<string | null>(null);
  const [autoSaves, setAutoSaves] = useState<AutoSaveSummary[]>([]);
  const [hasUnseenSaves, setHasUnseenSaves] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [savedConfig, setSavedConfig] = useState<{
    difficulty?: Difficulty;
    gameType?: GameType;
    focusCategories?: string[];
    categories?: CategorySuggestion[];
  } | null>(null);

  // Check for redirect reason from game pages
  useEffect(() => {
    const reason = sessionStorage.getItem(STORAGE_KEYS.REDIRECT_REASON);
    if (reason) {
      sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_REASON);
      setRedirectToast(reason);
    }
  }, []);

  // Auto-open config screen if returning from a game via "New Game"
  useEffect(() => {
    const savedTopic = sessionStorage.getItem(STORAGE_KEYS.SHOW_CONFIG);
    if (savedTopic !== null) {
      sessionStorage.removeItem(STORAGE_KEYS.SHOW_CONFIG);
      if (savedTopic) setTopic(savedTopic);
      const configStr = sessionStorage.getItem(STORAGE_KEYS.PUZZLE_CONFIG);
      if (configStr) {
        try {
          const config = JSON.parse(configStr);
          setSavedConfig({
            difficulty: config.difficulty,
            gameType: config.gameType,
            focusCategories: config.focusCategories,
            categories: config.categories,
          });
        } catch { /* ignore corrupt data */ }
        sessionStorage.removeItem(STORAGE_KEYS.PUZZLE_CONFIG);
      }
      setShowConfig(true);
    }
  }, []);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  useEffect(() => {
    // Check sessionStorage first for instant resume after SPA navigation
    // (pending autosave is now an object keyed by gameType)
    const pending = sessionStorage.getItem(STORAGE_KEYS.PENDING_AUTOSAVE);
    if (pending) {
      try {
        const pendingObj = JSON.parse(pending);
        const pendingSaves: AutoSaveSummary[] = Object.values(pendingObj);
        if (pendingSaves.length > 0) setAutoSaves(pendingSaves);
      } catch { /* ignore corrupt data */ }
      sessionStorage.removeItem(STORAGE_KEYS.PENDING_AUTOSAVE);
    }
    // Also fetch from server (authoritative, covers tab-close saves)
    getAutoSaves().then(setAutoSaves).catch(() => {});
    try { setHasUnseenSaves(localStorage.getItem(STORAGE_KEYS.UNSEEN_SAVES) === "1"); } catch {}
  }, []);

  // Prefetch categories as the user types (debounced 600ms)
  const prefetchCategories = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || isProfane(value)) {
      setPrefetchedCategories(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (prefetchTopicRef.current === value.trim()) return; // already fetched
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: value.trim() }),
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.categories?.length > 0) {
          prefetchTopicRef.current = value.trim();
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
    if (topicError) setTopicError(null);
    prefetchCategories(trimmed);
  };

  const handleSubmit = () => {
    if (!topic.trim()) return;
    if (isProfane(topic)) {
      setTopicError("This topic isn't available. Try something else.");
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 300);
      return;
    }
    setShowConfig(true);
  };

  const handleResume = (save: AutoSaveSummary) => {
    const storageKey = puzzleKeyForGameType(save.gameType);

    const route =
      save.gameType === "crossword"
        ? "/puzzle/crossword"
        : save.gameType === "anagram"
          ? "/puzzle/anagram"
          : save.gameType === "trivia"
            ? "/puzzle/trivia"
            : "/puzzle/wordsearch";

    sessionStorage.setItem(storageKey, JSON.stringify(save.puzzleData));
    sessionStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(save.gameState));
    router.push(route);
  };

  const handleSaveAutoSave = async (save: AutoSaveSummary): Promise<boolean> => {
    const result = await savePuzzle(
      save.gameType,
      save.title,
      save.difficulty,
      save.puzzleData
    );
    return !!result.id;
  };

  const handleDismissResume = async (save: AutoSaveSummary) => {
    await deleteAutoSave(save.gameType);
    setAutoSaves((prev) => prev.filter((s) => s.gameType !== save.gameType));
  };

  if (showConfig) {
    return (
      <ConfigScreen
        topic={topic}
        onTopicChange={setTopic}
        onBack={() => { setShowConfig(false); setSavedConfig(null); }}
        prefetchedCategories={savedConfig?.categories ?? (prefetchTopicRef.current === topic.trim() ? prefetchedCategories : null)}
        initialDifficulty={savedConfig?.difficulty}
        initialGameType={savedConfig?.gameType}
        initialFocusCategories={savedConfig?.focusCategories}
      />
    );
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Redirect to login regardless — session cookie will be cleared on next login
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 pb-20 relative" style={{ paddingTop: "8vh", background: "linear-gradient(180deg, #2D1B69 0%, #0c0a14 100%)" }}>
      {/* Nav icons — bookmark & stats left, logout right */}
      <div className="absolute top-6 left-5 right-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push("/saved")}
            className="relative flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255, 255, 255, 0.06)" }}
            title="Saved puzzles"
          >
            <Bookmark className="w-4 h-4" />
            {hasUnseenSaves && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gold-primary" />
            )}
          </button>
          <button
            onClick={() => setShowStats(true)}
            className="flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255, 255, 255, 0.06)" }}
            title="Stats"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255, 255, 255, 0.06)" }}
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
            WebkitTextStroke: "1px #F5D07A",
          }}>
        LEXICON
      </h1>

      {/* Tagline */}
      <p className="font-heading text-lg md:text-xl mb-16"
         style={{ color: "var(--white-muted)" }}>
        Turn your interests into word puzzles
      </p>

      {/* Topic Input + Generate Button — tight cohesive block */}
      <div className="w-full max-w-md flex flex-col" style={{ gap: "14px", padding: "0 24px" }}>
        <input
          type="text"
          value={topic}
          onChange={(e) => handleTopicChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="What are you into? Try '90s grunge' or 'classic jazz piano'"
          className={`w-full h-[52px] px-5 rounded-2xl text-base font-body text-white placeholder:text-white/50 outline-none transition-all${shakeInput ? " animate-shake" : ""}`}
          style={{
            background: "var(--glass-bg)",
            border: "2px solid var(--glass-border)",
          }}
          autoFocus
        />
        {topicError && (
          <p className="font-body" style={{ fontSize: 13, color: "rgba(255, 77, 106, 0.8)", marginTop: 6 }}>
            {topicError}
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!topic.trim() || isOffline}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 active:enabled:scale-[0.97]"
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
        {isOffline && (
          <p className="text-center font-body text-xs" style={{ color: "rgba(255, 77, 106, 0.7)" }}>
            You&apos;re offline — connect to the internet to generate puzzles
          </p>
        )}
      </div>

      {/* Resume Cards (one per active game) */}
      {autoSaves.length > 0 && (
        <div className="flex flex-col items-center mt-16 gap-4 w-full max-w-xl">
          <div className="flex items-center gap-3 w-full">
            <div className="h-px flex-1 bg-white/15" />
            <span className="text-[11px] uppercase tracking-[2px] text-white/50 font-heading font-semibold whitespace-nowrap">Resume Game{autoSaves.length > 1 ? "s" : ""}</span>
            <div className="h-px flex-1 bg-white/15" />
          </div>
          {autoSaves.map((save) => (
            <ResumeCard
              key={save.gameType}
              autoSave={save}
              onResume={() => handleResume(save)}
              onSave={() => handleSaveAutoSave(save)}
              onDismiss={() => handleDismissResume(save)}
            />
          ))}
        </div>
      )}

      {/* Quick Starts */}
      <div className={`flex flex-col items-center ${autoSaves.length > 0 ? "mt-8" : "mt-16"} gap-4 w-full max-w-md`}>
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

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      {redirectToast && (
        <Toast message={redirectToast} duration={4000} onDismiss={() => setRedirectToast(null)} />
      )}
    </main>
  );
}
