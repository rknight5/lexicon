"use client";

import { useState, useRef, useEffect } from "react";
import { Home } from "lucide-react";

interface WordSearchHeaderProps {
  title: string;
  onTitleChange: (title: string) => void;
  onBack: () => void;
  onHint: () => void;
  canHint: boolean;
  hintsRemaining: number;
  onMenu: () => void;
  gameStatus: string;
}

export function WordSearchHeader({
  title,
  onTitleChange,
  onBack,
  onHint,
  canHint,
  hintsRemaining,
  onMenu,
  gameStatus,
}: WordSearchHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commitEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setEditValue(title);
    }
    setEditing(false);
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40"
      style={{
        background: "var(--ws-header-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        paddingTop: "env(safe-area-inset-top, 40px)",
        paddingBottom: "2px",
      }}
    >
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: "80px 1fr 80px",
          padding: "6px 14px",
        }}
      >
        {/* Left — Home button */}
        <div className="flex justify-start">
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
            <Home style={{ width: 19, height: 19, color: "rgba(255, 255, 255, 0.7)" }} />
          </button>
        </div>

        {/* Center — Title + pencil as one unit */}
        <div className="flex items-center justify-center min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") {
                  setEditValue(title);
                  setEditing(false);
                }
              }}
              className="bg-transparent border-b text-center text-white outline-none w-full max-w-[200px]"
              style={{
                fontFamily: "var(--font-ws-body)",
                fontSize: 14,
                fontWeight: 600,
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center min-w-0 cursor-pointer"
              style={{ gap: 4 }}
            >
              <span
                className="text-white"
                style={{
                  fontFamily: "var(--font-ws-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {title}
              </span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255, 255, 255, 0.35)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0"
                style={{ alignSelf: "flex-start", marginTop: 1 }}
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          )}
        </div>

        {/* Right — Hint + Menu */}
        <div className="flex items-center justify-end gap-2">
          {/* Hint button */}
          <button
            onClick={onHint}
            disabled={!canHint}
            className="relative flex items-center justify-center cursor-pointer transition-opacity disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(247, 201, 72, 0.12)",
              border: "1px solid rgba(247, 201, 72, 0.18)",
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f7c948"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            {hintsRemaining > 0 && (
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: -4,
                  right: -4,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#f7c948",
                  color: "#1a1430",
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "var(--font-ws-mono)",
                }}
              >
                {hintsRemaining}
              </span>
            )}
          </button>

          {/* Hamburger menu */}
          <button
            onClick={onMenu}
            className="flex items-center justify-center cursor-pointer transition-opacity active:scale-95"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="flex flex-col items-center justify-center" style={{ gap: "3.5px" }}>
              <span style={{ width: 16, height: 1.5, background: "rgba(255, 255, 255, 0.5)", borderRadius: 1 }} />
              <span style={{ width: 16, height: 1.5, background: "rgba(255, 255, 255, 0.5)", borderRadius: 1 }} />
              <span style={{ width: 16, height: 1.5, background: "rgba(255, 255, 255, 0.5)", borderRadius: 1 }} />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
