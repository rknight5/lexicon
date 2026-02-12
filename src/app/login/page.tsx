"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
        credentials: "include",
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Could not connect to server");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5">
      <h1
        className="font-display text-5xl md:text-7xl tracking-[8px] mb-3"
        style={{
          color: "#F5D07A",
          textShadow: "0 0 30px rgba(245, 208, 122, 0.3)",
        }}
      >
        LEXICON
      </h1>

      <p
        className="font-heading text-lg mb-8"
        style={{ color: "var(--white-muted)" }}
      >
        Turn your interests into word puzzles
      </p>

      <div
        className="w-full max-w-xs rounded-card p-6 space-y-4"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <label
            className="block font-heading text-sm text-white/70 mb-1"
            htmlFor="username"
          >
            Your name
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter a name"
            maxLength={50}
            className="w-full h-[44px] px-4 rounded-xl text-base font-body text-white placeholder:text-white/50 outline-none"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--glass-border)",
            }}
            autoFocus
          />

          {error && (
            <p className="text-sm text-center" style={{ color: "var(--color-pink-accent)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full flex items-center justify-center gap-2 h-11 rounded-full font-heading text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
              color: "#1A0A2E",
              boxShadow: username.trim()
                ? "0 4px 15px rgba(255, 215, 0, 0.4)"
                : "none",
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Start Playing"
            )}
          </button>
        </form>

        <p
          className="text-xs text-center"
          style={{ color: "var(--white-muted)" }}
        >
          Your puzzle history is saved under this name
        </p>
      </div>
    </main>
  );
}
