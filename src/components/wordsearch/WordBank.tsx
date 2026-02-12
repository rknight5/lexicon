"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import type { PlacedWord } from "@/lib/types";

interface WordBankProps {
  words: PlacedWord[];
  foundWords: string[];
  gridHeight?: number;
}

export function WordBank({ words, foundWords, gridHeight }: WordBankProps) {
  const [activeClue, setActiveClue] = useState<string | null>(null);

  const grouped = words.reduce(
    (acc, word) => {
      if (!acc[word.category]) acc[word.category] = [];
      acc[word.category].push(word);
      return acc;
    },
    {} as Record<string, PlacedWord[]>
  );

  const found = foundWords.length;
  const total = words.length;

  return (
    <div>
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-xs uppercase tracking-widest text-white/50 font-semibold font-heading">
          Words
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-accent rounded-full transition-all duration-300"
              style={{ width: `${total > 0 ? (found / total) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-bold text-white/80 font-body">
            {found}/{total}
          </span>
        </div>
      </div>

      {/* Mobile: horizontal chip strip */}
      <div className="sm:hidden">
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {words.map((w) => {
            const isFound = foundWords.includes(w.word);
            return (
              <button
                key={w.word}
                onClick={() =>
                  setActiveClue(activeClue === w.word ? null : w.word)
                }
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  isFound
                    ? "bg-green-accent/20 border-green-accent/30 text-green-accent line-through"
                    : "bg-white/10 border-white/10 text-white"
                }`}
              >
                {w.word}
              </button>
            );
          })}
        </div>
        {activeClue && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-white/10 text-xs text-white/70 font-body">
            <span className="font-bold text-white/90">{activeClue}</span>
            {" \u2014 "}
            {words.find((w) => w.word === activeClue)?.clue}
          </div>
        )}
      </div>

      {/* Desktop: scrollable word bank */}
      <div
        className="hidden sm:block word-bank-scroll overflow-y-auto"
        style={{
          maxHeight:
            gridHeight && gridHeight > 100
              ? `${gridHeight - 60}px`
              : "calc(100vh - 180px)",
        }}
      >
        {Object.entries(grouped).map(([category, categoryWords], idx) => (
          <div key={category}>
            <div
              className={`flex items-center gap-2 ${idx > 0 ? "mt-3" : ""} mb-1`}
            >
              <span className="text-[10px] uppercase tracking-widest text-purple-light font-semibold font-heading">
                {category}
              </span>
            </div>
            {categoryWords.map((word) => {
              const isFound = foundWords.includes(word.word);
              return (
                <div
                  key={word.word}
                  className="flex items-center gap-2 py-2 pl-3"
                  style={{
                    borderLeft: `3px solid ${isFound ? "#00E676" : "transparent"}`,
                  }}
                  title={word.clue}
                >
                  {isFound ? (
                    <>
                      <span className="font-bold text-green-accent text-sm line-through opacity-50 font-body">
                        {word.word}
                      </span>
                      <CheckCircle className="w-3.5 h-3.5 text-green-accent flex-shrink-0 opacity-50" />
                    </>
                  ) : (
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-bold text-white text-sm tracking-wide flex-shrink-0 font-body">
                        {word.word}
                      </span>
                      <span className="text-xs text-white/60 truncate font-body">
                        {word.clue}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
