"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Grid3X3, Shuffle, Shield, Flame, Skull, Trash2, Play } from "lucide-react";
import { getSavedPuzzles, loadSavedPuzzle, deleteSavedPuzzle, type SavedPuzzleSummary } from "@/lib/storage";
import { Toast } from "@/components/shared/Toast";
import { STORAGE_KEYS, puzzleKeyForGameType } from "@/lib/storage-keys";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

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
  trivia: "Trivia",
};

export default function SavedPage() {
  const router = useRouter();
  const [puzzles, setPuzzles] = useState<SavedPuzzleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPuzzleId, setLoadingPuzzleId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; title: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.removeItem(STORAGE_KEYS.UNSEEN_SAVES); } catch {}
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
          : loaded.gameType === "trivia"
            ? "/puzzle/trivia"
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

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const ok = await deleteSavedPuzzle(pendingDelete.id);
    if (ok) {
      setPuzzles((prev) => prev.filter((p) => p.id !== pendingDelete.id));
    } else {
      setErrorMessage("Couldn't delete puzzle — check your connection");
    }
    setPendingDelete(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div
        className="h-14 px-5 flex items-center border-b relative"
        style={{
          background: "var(--ws-header-bg)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
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
      <div className="flex-1 flex flex-col items-center px-5 py-6">
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
                  <div className="hidden md:flex flex-shrink-0">
                    {GAME_TYPE_ICON[puzzle.gameType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading text-sm font-bold text-white max-w-[60%] md:max-w-none">
                      {puzzle.title}
                    </div>
                    <div className="text-[11px] text-white/50 font-body mt-1 flex items-center gap-2">
                      <span>{GAME_TYPE_LABEL[puzzle.gameType] ?? puzzle.gameType}</span>
                      {DIFFICULTY_ICON[puzzle.difficulty]}
                      {puzzle.createdAt && (
                        <>
                          <span className="text-white/25">·</span>
                          <span>{timeAgo(puzzle.createdAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Mobile Play */}
                    <button
                      onClick={() => handleLoad(puzzle)}
                      disabled={loadingPuzzleId === puzzle.id}
                      className="md:hidden flex items-center gap-1 font-heading font-bold uppercase transition-all hover:brightness-125 active:scale-95 disabled:opacity-50"
                      style={{
                        padding: "6px 12px",
                        fontSize: "10px",
                        borderRadius: "7px",
                        background: "linear-gradient(135deg, #f7c948, #e5b52e)",
                        color: "#1a1430",
                        letterSpacing: "0.05em",
                      }}
                      title="Play puzzle"
                    >
                      <Play style={{ width: "10px", height: "10px" }} fill="currentColor" />
                      Play
                    </button>
                    {/* Web Play */}
                    <button
                      onClick={() => handleLoad(puzzle)}
                      disabled={loadingPuzzleId === puzzle.id}
                      className="hidden md:flex items-center gap-1 text-[10px] uppercase tracking-wider font-heading font-bold px-3 py-1.5 rounded-pill transition-all hover:brightness-125 active:scale-95 disabled:opacity-50"
                      style={{ background: "rgba(255, 215, 0, 0.15)", color: "#FFD700" }}
                      title="Play puzzle"
                    >
                      <Play className="w-3 h-3" fill="currentColor" />
                      Play
                    </button>
                    {/* Mobile Delete */}
                    <button
                      onClick={() => setPendingDelete({ id: puzzle.id, title: puzzle.title })}
                      className="md:hidden flex items-center justify-center transition-all hover:brightness-125 active:scale-95"
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        background: "rgba(255, 255, 255, 0.04)",
                      }}
                      title="Delete puzzle"
                    >
                      <Trash2 style={{ width: "13px", height: "13px", color: "rgba(255, 77, 106, 0.5)" }} />
                    </button>
                    {/* Web Delete */}
                    <button
                      onClick={() => setPendingDelete({ id: puzzle.id, title: puzzle.title })}
                      className="hidden md:flex items-center gap-1 text-[10px] uppercase tracking-wider font-heading font-bold px-3 py-1.5 rounded-pill transition-all hover:brightness-125 active:scale-95"
                      style={{
                        background: "rgba(255, 64, 129, 0.15)",
                        color: "#FF4081",
                      }}
                      title="Delete puzzle"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Dark overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0, 0, 0, 0.6)" }}
            onClick={() => setPendingDelete(null)}
          />
          {/* Modal card */}
          <div
            className="relative flex flex-col items-center mx-4"
            style={{
              width: "100%",
              maxWidth: 320,
              padding: 28,
              background: "rgba(22, 14, 42, 0.95)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(167, 139, 250, 0.15)",
              borderRadius: 18,
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
            }}
          >
            {/* Red-tinted trash icon circle */}
            <div
              className="flex items-center justify-center"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255, 77, 106, 0.1)",
                border: "1px solid rgba(255, 77, 106, 0.2)",
              }}
            >
              <Trash2 style={{ width: 22, height: 22, color: "#ff4d6a" }} />
            </div>

            {/* Title */}
            <span className="font-heading text-[16px] font-semibold text-white mt-4">
              Delete Puzzle?
            </span>

            {/* Puzzle name */}
            <span className="font-body text-[13px] mt-1.5" style={{ color: "#f7c948" }}>
              {pendingDelete.title}
            </span>

            {/* Description */}
            <span
              className="font-body text-[13px] text-center mt-2"
              style={{ color: "rgba(255, 255, 255, 0.5)" }}
            >
              This will permanently remove the puzzle from your library.
            </span>

            {/* DELETE button */}
            <button
              onClick={confirmDelete}
              className="w-full h-10 rounded-xl font-heading text-[13px] font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 active:scale-[0.97] cursor-pointer mt-5"
              style={{ background: "#ff4d6a" }}
            >
              Delete
            </button>

            {/* CANCEL button */}
            <button
              onClick={() => setPendingDelete(null)}
              className="w-full h-10 rounded-xl font-heading text-[13px] font-bold uppercase tracking-wider transition-all hover:brightness-125 active:scale-[0.97] cursor-pointer mt-2"
              style={{
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <Toast
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}
    </div>
  );
}
