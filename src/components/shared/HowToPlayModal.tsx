"use client";

import { X } from "lucide-react";
import type { GameType } from "@/lib/types";

interface HowToPlayModalProps {
  gameType: GameType;
  onClose: () => void;
}

const GAME_LABELS: Record<GameType, string> = {
  wordsearch: "Word Search",
  crossword: "Crossword",
  anagram: "Anagram",
  trivia: "Trivia",
};

const GAME_STEPS: Record<GameType, { emoji: string; text: string }[]> = {
  wordsearch: [
    { emoji: "\ud83d\udc46", text: "Drag across letters to form words." },
    { emoji: "\ud83d\udd0d", text: "Find all hidden words in the grid." },
    { emoji: "\u2b50", text: "Each word found earns points." },
    { emoji: "\ud83d\udc94", text: "Lose a heart for incorrect guesses." },
  ],
  crossword: [
    { emoji: "\ud83d\udc46", text: "Tap a cell to select it." },
    { emoji: "\u2328\ufe0f", text: "Type letters to fill in answers." },
    { emoji: "\ud83d\udcdd", text: "Tap a clue to jump to that word." },
    { emoji: "\ud83d\udc94", text: "Lose a heart for incorrect submissions." },
  ],
  anagram: [
    { emoji: "\ud83d\udc46", text: "Tap scrambled letters to place them in the slots." },
    { emoji: "\ud83d\udca1", text: "Use the clue to figure out the word." },
    { emoji: "\u2705", text: "Submit when all slots are filled." },
    { emoji: "\u23ed\ufe0f", text: "Skip to move to the next word." },
  ],
  trivia: [
    { emoji: "\u23f0", text: "Read the question before time runs out." },
    { emoji: "\ud83d\udc46", text: "Tap an answer to submit." },
    { emoji: "\ud83d\udca1", text: "Use hints to eliminate a wrong answer (multiple choice only)." },
    { emoji: "\u26a1", text: "Earn bonus points for fast answers." },
  ],
};

export function HowToPlayModal({ gameType, onClose }: HowToPlayModalProps) {
  const steps = GAME_STEPS[gameType];
  const label = GAME_LABELS[gameType];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-sm p-6"
        style={{
          background: "rgba(22, 14, 42, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(167, 139, 250, 0.15)",
          borderRadius: 24,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <X className="w-4.5 h-4.5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="font-heading text-2xl font-bold text-gold-primary">
            How to Play
          </h2>
          <p className="font-body text-sm mt-1" style={{ color: "var(--white-muted)" }}>
            {label}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-3.5 py-3 rounded-xl"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <span className="flex-shrink-0 text-base leading-none mt-0.5">{step.emoji}</span>
              <p className="font-body text-sm" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>

        {/* Hint/scoring note */}
        <div
          className="mt-5 px-3.5 py-3 rounded-xl"
          style={{
            background: "rgba(167, 139, 250, 0.06)",
            border: "1px solid rgba(167, 139, 250, 0.12)",
          }}
        >
          <p className="font-body text-xs leading-relaxed" style={{ color: "var(--white-muted)" }}>
            <span className="mr-1">{"\u26a1"}</span>
            Use hints to reveal a letter (3 per game). Earn bonus points for completing puzzles with all 3 lives.
          </p>
        </div>
      </div>
    </div>
  );
}
