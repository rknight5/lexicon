import { useState, useEffect, useRef } from "react";

// Messages ordered by logical progress — exploratory → constructive → conclusive
const MESSAGES = [
  "Exploring your topic",
  "Choosing the perfect words",
  "Crafting clever clues",
  "Building the grid",
  "Placing hidden words",
  "Shuffling everything around",
  "Adding the finishing touches",
  "Almost ready",
];

// Weighted durations: early/mid messages ~80% of time, final stretch ~20%
// Total budget ~25s (well under 60s timeout), messages never repeat
const MESSAGE_DURATIONS = [
  3500, // Exploring your topic
  3500, // Choosing the perfect words
  3500, // Crafting clever clues
  3500, // Building the grid
  3000, // Placing hidden words
  3000, // Shuffling everything around
  2500, // Adding the finishing touches
  8000, // Almost ready (sits here until done)
];

const SPARKLES = [
  { size: 4, color: "#C084FC", radius: 52, duration: 5, delay: 0 },
  { size: 3, color: "#E9D5FF", radius: 60, duration: 7, delay: 0.8 },
  { size: 5, color: "#A855F7", radius: 48, duration: 4.5, delay: 1.6 },
  { size: 3, color: "#F3E8FF", radius: 65, duration: 6, delay: 2.4 },
  { size: 4, color: "#D8B4FE", radius: 55, duration: 8, delay: 0.4 },
  { size: 3, color: "#C084FC", radius: 58, duration: 5.5, delay: 3.2 },
];

interface LoadingOverlayProps {
  onCancel?: () => void;
}

export function LoadingOverlay({ onCancel }: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const advance = (index: number) => {
      if (index >= MESSAGES.length - 1) return; // stay on last message
      timeoutRef.current = setTimeout(() => {
        setMessageIndex(index + 1);
        advance(index + 1);
      }, MESSAGE_DURATIONS[index]);
    };
    advance(0);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-5"
      style={{
        background: "#0c0a14",
        overflow: "hidden",
      }}
    >
      {/* Effects wrapper — gives pulse rings and sparkles room */}
      <div className="relative flex items-center justify-center mb-8" style={{ width: 192, height: 192 }}>
        {/* Pulse ring 1 */}
        <div
          className="absolute rounded-full"
          style={{
            top: "50%",
            left: "50%",
            width: 80,
            height: 80,
            transform: "translate(-50%, -50%) scale(1)",
            opacity: 0,
            border: "2px solid rgba(168, 85, 247, 0.35)",
            animation: "lo-pulse-ring 3s ease-out infinite",
          }}
        />
        {/* Pulse ring 2 */}
        <div
          className="absolute rounded-full"
          style={{
            top: "50%",
            left: "50%",
            width: 80,
            height: 80,
            transform: "translate(-50%, -50%) scale(1)",
            opacity: 0,
            border: "2px solid rgba(192, 132, 252, 0.25)",
            animation: "lo-pulse-ring 3s ease-out 1.5s infinite",
          }}
        />

        {/* 3D orb with breathing pulse + float */}
        <div
          className="relative w-20 h-20"
          style={{ animation: "lo-orb-float 3s ease-in-out infinite, lo-orb-breathe 2s ease-in-out infinite" }}
        >
          {/* Base sphere — radially symmetric gradient (no seam) */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 50%, #C084FC 0%, #A855F7 20%, #7B3FBF 45%, #5B2D8E 70%, #2E1065 100%)",
              boxShadow: "0 0 40px rgba(123, 63, 191, 0.5), 0 8px 24px rgba(0, 0, 0, 0.4), inset 0 -8px 20px rgba(0, 0, 0, 0.4), inset 0 4px 10px rgba(192, 132, 252, 0.2)",
            }}
          />
          {/* Ambient glow — radial so identical from any angle, pulses instead of rotating */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(192, 132, 252, 0.25) 0%, rgba(168, 85, 247, 0.1) 40%, transparent 70%)",
              animation: "lo-orb-glow 2.5s ease-in-out infinite",
            }}
          />
          {/* Specular highlight — fixed, not rotating */}
          <div
            className="absolute rounded-full"
            style={{
              top: "12%",
              left: "22%",
              width: "30%",
              height: "20%",
              background: "radial-gradient(ellipse, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0) 70%)",
              transform: "rotate(-20deg)",
            }}
          />
          {/* Secondary reflection */}
          <div
            className="absolute rounded-full"
            style={{
              top: "20%",
              left: "15%",
              width: "18%",
              height: "12%",
              background: "radial-gradient(ellipse, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 70%)",
              transform: "rotate(-30deg)",
            }}
          />
          {/* Rim light */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.3) 0%, transparent 40%)",
            }}
          />
          {/* Ground shadow */}
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2"
            style={{
              width: "70%",
              height: "8px",
              background: "radial-gradient(ellipse, rgba(123, 63, 191, 0.3) 0%, transparent 70%)",
              borderRadius: "50%",
              animation: "lo-orb-shadow 3s ease-in-out infinite",
            }}
          />
        </div>

        {/* Sparkle particles */}
        {SPARKLES.map((s, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              top: "50%",
              left: "50%",
              width: 0,
              height: 0,
              animation: `lo-sparkle-orbit ${s.duration}s linear ${s.delay}s infinite`,
              ["--orbit-radius" as string]: `${s.radius}px`,
            }}
          >
            <div
              className="rounded-full"
              style={{
                width: s.size,
                height: s.size,
                background: s.color,
                boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
                animation: `lo-sparkle-twinkle ${1.5 + i * 0.3}s ease-in-out infinite`,
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes lo-orb-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes lo-orb-breathe {
          0%, 100% { scale: 1; }
          50% { scale: 1.05; }
        }
        @keyframes lo-orb-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes lo-orb-shadow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(0.8); opacity: 0.6; }
        }
        @keyframes lo-pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.8);
            opacity: 0;
          }
        }
        @keyframes lo-sparkle-orbit {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(var(--orbit-radius));
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateX(var(--orbit-radius));
          }
        }
        @keyframes lo-sparkle-twinkle {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        @keyframes lo-message-fade {
          0% { opacity: 0; transform: translateY(6px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
      `}</style>

      <p className="font-heading text-lg text-white mb-2">
        Building your puzzle
      </p>
      <div style={{ minHeight: 20 }}>
        <p
          key={messageIndex}
          className="font-body text-sm"
          style={{
            color: "var(--white-muted)",
            animation: `lo-message-fade ${Math.min(MESSAGE_DURATIONS[messageIndex], 3000)}ms ease-in-out`,
          }}
        >
          {MESSAGES[messageIndex]}
        </p>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-12 px-5 py-2 rounded-pill font-body text-sm text-white/80 hover:text-white transition-colors"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
