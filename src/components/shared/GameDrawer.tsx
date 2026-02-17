"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Info, Share2, BarChart2, Settings, LogOut } from "lucide-react";
import { HowToPlayModal } from "@/components/shared/HowToPlayModal";
import type { GameType } from "@/lib/types";

interface GameDrawerProps {
  gameType: GameType;
  open: boolean;
  onClose: () => void;
  onStats: () => void;
  onShare: () => void;
  onSettings: () => void;
}

function applyHover(btn: HTMLButtonElement) {
  const icon = btn.querySelector("[data-menu-icon]") as HTMLElement | null;
  const label = btn.querySelector("[data-menu-label]") as HTMLElement | null;
  btn.style.background = "rgba(167, 139, 250, 0.1)";
  if (icon) icon.style.color = "#a78bfa";
  if (label) label.style.color = "rgba(255, 255, 255, 1)";
}

function clearHover(btn: HTMLButtonElement) {
  const icon = btn.querySelector("[data-menu-icon]") as HTMLElement | null;
  const label = btn.querySelector("[data-menu-label]") as HTMLElement | null;
  btn.style.background = "transparent";
  if (icon) icon.style.color = "rgba(255, 255, 255, 0.45)";
  if (label) label.style.color = "rgba(255, 255, 255, 0.8)";
}

export function GameDrawer({
  gameType,
  open,
  onClose,
  onStats,
  onShare,
  onSettings,
}: GameDrawerProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  const handleStats = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      onStats();
    }, 200);
  }, [onClose, onStats]);

  const handleShare = useCallback(() => {
    onShare();
    handleClose();
  }, [onShare, handleClose]);

  const handleSettings = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      onClose();
      onSettings();
    }, 200);
  }, [onClose, onSettings]);

  const handleLogout = useCallback(async () => {
    setVisible(false);
    setTimeout(onClose, 200);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
  }, [onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Dark overlay backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          opacity: visible ? 1 : 0,
        }}
        onClick={handleClose}
      />

      {/* Dropdown — anchored top-right below header */}
      <div
        ref={menuRef}
        className="absolute transition-all duration-200 ease-out"
        style={{
          top: "calc(env(safe-area-inset-top, 40px) + 46px)",
          right: 14,
          width: 200,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(-8px) scale(0.95)",
          transformOrigin: "top right",
          background: "rgba(22, 14, 42, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: 14,
          border: "1px solid rgba(167, 139, 250, 0.15)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
      >
        <div className="py-1">
          {/* How to Play */}
          <button
            onClick={() => setShowHowToPlay(true)}
            className="w-full flex items-center gap-2.5 transition-colors cursor-pointer"
            style={{ padding: "11px 14px" }}
            onMouseEnter={(e) => applyHover(e.currentTarget)}
            onMouseLeave={(e) => clearHover(e.currentTarget)}
          >
            <Info data-menu-icon="" style={{ width: 18, height: 18, color: "rgba(255, 255, 255, 0.45)" }} />
            <span
              data-menu-label=""
              className="font-body text-[13px] font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              How to Play
            </span>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255, 255, 255, 0.06)", margin: "2px 12px" }} />

          {/* Share Puzzle */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-2.5 transition-colors cursor-pointer"
            style={{ padding: "11px 14px" }}
            onMouseEnter={(e) => applyHover(e.currentTarget)}
            onMouseLeave={(e) => clearHover(e.currentTarget)}
          >
            <Share2 data-menu-icon="" style={{ width: 18, height: 18, color: "rgba(255, 255, 255, 0.45)" }} />
            <span
              data-menu-label=""
              className="font-body text-[13px] font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Share Puzzle
            </span>
          </button>

          {/* Stats */}
          <button
            onClick={handleStats}
            className="w-full flex items-center gap-2.5 transition-colors cursor-pointer"
            style={{ padding: "11px 14px" }}
            onMouseEnter={(e) => applyHover(e.currentTarget)}
            onMouseLeave={(e) => clearHover(e.currentTarget)}
          >
            <BarChart2 data-menu-icon="" style={{ width: 18, height: 18, color: "rgba(255, 255, 255, 0.45)" }} />
            <span
              data-menu-label=""
              className="font-body text-[13px] font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Stats
            </span>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255, 255, 255, 0.06)", margin: "2px 12px" }} />

          {/* Settings */}
          <button
            onClick={handleSettings}
            className="w-full flex items-center gap-2.5 transition-colors cursor-pointer"
            style={{ padding: "11px 14px" }}
            onMouseEnter={(e) => applyHover(e.currentTarget)}
            onMouseLeave={(e) => clearHover(e.currentTarget)}
          >
            <Settings data-menu-icon="" style={{ width: 18, height: 18, color: "rgba(255, 255, 255, 0.45)" }} />
            <span
              data-menu-label=""
              className="font-body text-[13px] font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Settings
            </span>
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255, 255, 255, 0.06)", margin: "2px 12px" }} />

          {/* Log Out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 transition-colors cursor-pointer"
            style={{ padding: "11px 14px" }}
            onMouseEnter={(e) => applyHover(e.currentTarget)}
            onMouseLeave={(e) => clearHover(e.currentTarget)}
          >
            <LogOut data-menu-icon="" style={{ width: 18, height: 18, color: "rgba(255, 255, 255, 0.45)" }} />
            <span
              data-menu-label=""
              className="font-body text-[13px] font-medium"
              style={{ color: "rgba(255, 255, 255, 0.8)" }}
            >
              Log Out
            </span>
          </button>
        </div>
      </div>

      {showHowToPlay && (
        <HowToPlayModal gameType={gameType} onClose={() => setShowHowToPlay(false)} />
      )}
    </div>
  );
}
