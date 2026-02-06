"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ConfigScreen } from "@/components/shared/ConfigScreen";

const EXAMPLE_TOPICS = [
  "80s Rock",
  "Italian Cuisine",
  "Marvel Universe",
  "Ancient Egypt",
  "Dog Breeds",
  "Space Exploration",
];

export default function HomePage() {
  const [topic, setTopic] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  const handleSubmit = () => {
    if (!topic.trim()) return;
    setShowConfig(true);
  };

  if (showConfig) {
    return (
      <ConfigScreen
        topic={topic}
        onTopicChange={setTopic}
        onBack={() => setShowConfig(false)}
      />
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 py-12">
      {/* Logo */}
      <h1 className="font-display text-5xl md:text-7xl text-gold-primary tracking-wider mb-3"
          style={{ textShadow: "0 0 30px rgba(255, 215, 0, 0.3)" }}>
        LEXICON
      </h1>

      {/* Tagline */}
      <p className="font-heading text-lg md:text-xl mb-10"
         style={{ color: "var(--white-muted)" }}>
        Turn your interests into word puzzles
      </p>

      {/* Topic Input */}
      <div className="w-full max-w-md mb-6">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value.slice(0, 200))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="What are you into? Try '90s grunge' or 'classic jazz piano'"
          className="w-full h-[52px] px-5 rounded-2xl text-base font-body text-white placeholder:text-white/40 outline-none transition-all"
          style={{
            background: "var(--glass-bg)",
            border: "2px solid var(--glass-border)",
          }}
          autoFocus
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleSubmit}
        disabled={!topic.trim()}
        className="flex items-center gap-2 h-12 px-8 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:enabled:-translate-y-0.5 active:enabled:scale-[0.97]"
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

      {/* Example Chips */}
      <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-md">
        {EXAMPLE_TOPICS.map((example) => (
          <button
            key={example}
            onClick={() => {
              setTopic(example);
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
    </main>
  );
}
