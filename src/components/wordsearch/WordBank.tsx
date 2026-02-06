import { CheckCircle } from "lucide-react";
import type { PlacedWord } from "@/lib/types";

interface WordBankProps {
  words: PlacedWord[];
  foundWords: string[];
}

export function WordBank({ words, foundWords }: WordBankProps) {
  // Group words by category
  const grouped = words.reduce(
    (acc, word) => {
      if (!acc[word.category]) acc[word.category] = [];
      acc[word.category].push(word);
      return acc;
    },
    {} as Record<string, PlacedWord[]>
  );

  return (
    <div className="space-y-1">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-heading text-sm font-bold text-white/60">
          WORDS
        </span>
        <span className="font-body text-sm text-white/60">
          {foundWords.length} / {words.length}
        </span>
      </div>

      {/* Grouped words */}
      {Object.entries(grouped).map(([category, categoryWords], idx) => (
        <div key={category} className={idx > 0 ? "mt-4" : ""}>
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider mb-2 text-white/40">
            {category}
          </h3>
          <div className="space-y-2">
            {categoryWords.map((word) => {
              const isFound = foundWords.includes(word.word);
              return (
                <div
                  key={word.word}
                  className={`flex items-start gap-2 transition-opacity ${
                    isFound ? "opacity-50" : ""
                  }`}
                >
                  {isFound && (
                    <CheckCircle className="w-4 h-4 text-green-accent flex-shrink-0 mt-0.5" />
                  )}
                  <div className={isFound ? "ml-0" : "ml-6"}>
                    <span
                      className={`font-body text-sm font-semibold uppercase ${
                        isFound ? "line-through text-white/40" : "text-white"
                      }`}
                    >
                      {word.word}
                    </span>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--white-muted)" }}
                    >
                      {word.clue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
