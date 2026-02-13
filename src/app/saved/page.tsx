"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Grid3X3, Shuffle, Shield, Flame, Skull, Trash2, Play } from "lucide-react";
import { getSavedPuzzles, loadSavedPuzzle, deleteSavedPuzzle, type SavedPuzzleSummary } from "@/lib/storage";
import { Toast } from "@/components/shared/Toast";
import { STORAGE_KEYS, puzzleKeyForGameType } from "@/lib/storage-keys";

const GAME_TYPE_ICON: Record<string, React.ReactNode> = {
  wordsearch: <Search className="w-5 h-5 text-white/60" />,
  crossword: <Grid3X3 className="w-5 h-5 text-white/60" />,
  anagram: <Shuffle className="w-5 h-5 text-white/60" />,
};

const DIFFICULTY_ICON: Record<string, React.ReactNode> = {
  easy: <Shield className="w-3 h-3 text-green-accent" />,
  medium: <Flame className="w-3 h-3 text-gold-primary" />,
  hard: <Skull className="w-3 h-3 text-pink-accent" />,
};

const GAME_TYPE_LABEL: Record<string, string> = {
  wordsearch: "Word Search",
  crossword: "Crossword",
  anagram: "Anagram",
};

export default function SavedPage() {
  const router = useRouter();
  const [puzzles, setPuzzles] = useState<SavedPuzzleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPuzzleId, setLoadingPuzzleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    getSavedPuzzles().then((p) => {
      setPuzzles(p);
      setLoading(false);
    });
  }, []);

  const handleLoad = async (puzzle: SavedPuzzleSummary) => {
    setErrorMessage(null);
    setLoadingPuzzleId(puzzle.id);
    const loaded = await loadSavedPuzzle(puzzle.id);
    if (!loaded) {
      setLoadingPuzzleId(null);
      setErrorMessage("Couldn't load puzzle — check your connection");
      return;
    }

    const storageKey = puzzleKeyForGameType(loaded.gameType);

    const route =
      loaded.gameType === "crossword"
        ? "/puzzle/crossword"
        : loaded.gameType === "anagram"
          ? "/puzzle/anagram"
          : "/puzzle/wordsearch";

    try {
      sessionStorage.removeItem(STORAGE_KEYS.GAME_STATE);
      sessionStorage.setItem(storageKey, JSON.stringify(loaded.puzzleData));
    } catch {
      setLoadingPuzzleId(null);
      setErrorMessage("Couldn't load puzzle — try again");
      return;
    }
    router.push(route);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) {
      const ok = await deleteSavedPuzzle(id);
      if (ok) {
        setPuzzles((prev) => prev.filter((p) => p.id !== id));
      }
      setDeletingId(null);
    } else {
      setDeletingId(id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div
        className="h-14 px-5 flex items-center border-b relative"
        style={{
          background: "#1A0A2E",
          borderColor: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-body text-sm">Back</span>
        </button>
        <span className="absolute left-1/2 -translate-x-1/2 font-heading text-base font-bold">
          Saved Puzzles
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-5 py-6" onClick={() => setDeletingId(null)}>
        <div className="w-full max-w-xl">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "var(--glass-bg)" }} />
              ))}
            </div>
          ) : puzzles.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/60 font-body text-sm">
                No saved puzzles yet.
              </p>
              <p className="text-white/45 font-body text-xs mt-2">
                Bookmark puzzles during gameplay to add them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {puzzles.map((puzzle) => (
                <div
                  key={puzzle.id}
                  className="w-full p-4 rounded-2xl flex items-center gap-4"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    borderLeft: "3px solid #FFD700",
                  }}
                >
                  <div className="flex-shrink-0">
                    {GAME_TYPE_ICON[puzzle.gameType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-bold text-white truncate">
                        {puzzle.title}
                      </span>
                      {DIFFICULTY_ICON[puzzle.difficulty]}
                    </div>
                    <div className="text-[11px] text-white/50 font-body mt-1">
                      {GAME_TYPE_LABEL[puzzle.gameType] ?? puzzle.gameType}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleLoad(puzzle)}
                      disabled={loadingPuzzleId === puzzle.id}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-heading font-bold px-3 py-1.5 rounded-pill transition-all hover:brightness-125 active:scale-95 disabled:opacity-50"
                      style={{ background: "rgba(255, 215, 0, 0.15)", color: "#FFD700" }}
                      title="Play puzzle"
                    >
                      <Play className="w-3 h-3" fill="currentColor" />
                      Play
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, puzzle.id)}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-heading font-bold px-3 py-1.5 rounded-pill transition-all hover:brightness-125 active:scale-95"
                      style={{
                        background: deletingId === puzzle.id ? "rgba(255, 64, 129, 0.3)" : "rgba(255, 64, 129, 0.15)",
                        color: "#FF4081",
                      }}
                      title={deletingId === puzzle.id ? "Click again to confirm" : "Delete puzzle"}
                    >
                      <Trash2 className="w-3 h-3" />
                      {deletingId === puzzle.id ? "Confirm" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <Toast
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
}
