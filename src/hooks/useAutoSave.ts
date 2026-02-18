import { useEffect, useRef, useCallback } from "react";
import { upsertAutoSave, deleteAutoSave } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type {
  GameType,
  Difficulty,
  PuzzleData,
  CrosswordPuzzleData,
  AnagramPuzzleData,
  TriviaPuzzleData,
} from "@/lib/types";

interface UseAutoSaveOptions {
  gameType: GameType;
  title: string;
  difficulty: Difficulty;
  puzzleData: PuzzleData | CrosswordPuzzleData | AnagramPuzzleData | TriviaPuzzleData;
  gameStatus: string;
  getGameState: () => Record<string, unknown>;
  onSessionExpired?: () => void;
  onSaveFailed?: () => void;
}

const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds

export function useAutoSave({
  gameType,
  title,
  difficulty,
  puzzleData,
  gameStatus,
  getGameState,
  onSessionExpired,
  onSaveFailed,
}: UseAutoSaveOptions): void {
  const savingRef = useRef(false);
  const deletedRef = useRef(false);
  const gameStatusRef = useRef(gameStatus);
  const failNotifiedRef = useRef(false);

  // Keep stable refs for values used in doSave so the callback identity stays fixed
  const optionsRef = useRef({ gameType, title, difficulty, puzzleData, getGameState, onSessionExpired, onSaveFailed });
  useEffect(() => {
    optionsRef.current = { gameType, title, difficulty, puzzleData, getGameState, onSessionExpired, onSaveFailed };
    gameStatusRef.current = gameStatus;
  });

  const doSave = useCallback(async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      const { gameType: gt, title: t, difficulty: d, puzzleData: pd, getGameState: gs } =
        optionsRef.current;
      const result = await upsertAutoSave(gt, t, d, pd, gs());
      if (result.error === "session-expired") {
        optionsRef.current.onSessionExpired?.();
      } else if (result.error === "network" && !failNotifiedRef.current) {
        failNotifiedRef.current = true;
        optionsRef.current.onSaveFailed?.();
      }
      if (result.ok) {
        failNotifiedRef.current = false;
      }
    } catch {
      // swallow — auto-save is best-effort
    } finally {
      savingRef.current = false;
    }
  }, []);

  // ── Initial save on mount so the puzzle is resumable immediately ──
  const didInitialSave = useRef(false);
  useEffect(() => {
    if (!didInitialSave.current) {
      didInitialSave.current = true;
      doSave();
    }
  }, [doSave]);

  // ── Periodic save every 30s while playing ──
  useEffect(() => {
    if (gameStatus !== "playing") return;
    const id = setInterval(doSave, AUTO_SAVE_INTERVAL);
    return () => clearInterval(id);
  }, [gameStatus, doSave]);

  // ── Save on pause ──
  useEffect(() => {
    if (gameStatus === "paused") {
      doSave();
    }
  }, [gameStatus, doSave]);

  // ── Save when title changes (user rename) ──
  const prevTitleRef = useRef(title);
  useEffect(() => {
    if (title !== prevTitleRef.current) {
      prevTitleRef.current = title;
      doSave();
    }
  }, [title, doSave]);

  // ── Save on visibility change (tab hidden / app backgrounded) ──
  useEffect(() => {
    function handleVisibility() {
      if (
        document.hidden &&
        (optionsRef.current.getGameState !== undefined) &&
        (gameStatus === "idle" || gameStatus === "playing" || gameStatus === "paused")
      ) {
        doSave();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [gameStatus, doSave]);

  // ── Save on beforeunload with keepalive fetch ──
  useEffect(() => {
    function handleBeforeUnload() {
      if (gameStatus !== "idle" && gameStatus !== "playing" && gameStatus !== "paused") return;
      const { gameType: gt, title: t, difficulty: d, puzzleData: pd, getGameState: gs } =
        optionsRef.current;
      try {
        fetch("/api/autosave", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameType: gt,
            title: t,
            difficulty: d,
            puzzleData: pd,
            gameState: gs(),
          }),
          credentials: "include",
          keepalive: true,
        });
      } catch {
        // best-effort
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameStatus]);

  // ── Save on component unmount (SPA navigation) ──
  useEffect(() => {
    return () => {
      if (gameStatusRef.current !== "idle" && gameStatusRef.current !== "playing" && gameStatusRef.current !== "paused") return;
      if (deletedRef.current) return;
      const { gameType: gt, title: t, difficulty: d, puzzleData: pd, getGameState: gs } =
        optionsRef.current;
      const payload = {
        gameType: gt,
        title: t,
        difficulty: d,
        puzzleData: pd,
        gameState: gs(),
      };
      // Write to sessionStorage synchronously so the home page can read it
      // immediately — the async fetch below may not complete before the home
      // page's getAutoSave() call hits the server.
      try {
        sessionStorage.setItem(
          STORAGE_KEYS.PENDING_AUTOSAVE,
          JSON.stringify({ ...payload, updatedAt: new Date().toISOString() })
        );
      } catch {
        // private browsing or quota
      }
      try {
        fetch("/api/autosave", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
          keepalive: true,
        });
      } catch {
        // best-effort
      }
    };
  }, []);

  // ── Delete auto-save on game end ──
  useEffect(() => {
    if ((gameStatus === "won" || gameStatus === "lost") && !deletedRef.current) {
      deletedRef.current = true;
      deleteAutoSave().catch(() => {});
    }
  }, [gameStatus]);
}
