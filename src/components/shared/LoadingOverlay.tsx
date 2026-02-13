import { useState, useEffect } from "react";

const MESSAGES = [
  "Choosing the perfect words",
  "Crafting clever clues",
  "Shuffling everything around",
  "Adding the finishing touches",
  "Almost ready",
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

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(180deg, #2D1B69 0%, #1A0A2E 100%)" }}
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
            border: "2px solid rgba(168, 85, 247, 0.35)",
            animation: "pulse-ring 3s ease-out infinite",
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
            border: "2px solid rgba(192, 132, 252, 0.25)",
            animation: "pulse-ring 3s ease-out 1.5s infinite",
          }}
        />

        {/* 3D rotating orb */}
        <div className="relative w-20 h-20" style={{ animation: "orb-float 3s ease-in-out infinite" }}>
          {/* Base sphere with rotating gradient */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 30%, #C084FC 0%, #A855F7 15%, #7B3FBF 40%, #5B2D8E 65%, #2E1065 100%)",
              boxShadow: "0 0 40px rgba(123, 63, 191, 0.5), 0 8px 24px rgba(0, 0, 0, 0.4), inset -6px -6px 20px rgba(0, 0, 0, 0.4), inset 3px 3px 10px rgba(192, 132, 252, 0.2)",
            }}
          />
          {/* Rotating highlight band — simulates a turning surface */}
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ animation: "orb-rotate 4s linear infinite" }}
          >
            <div
              className="absolute"
              style={{
                top: "10%",
                left: "-20%",
                width: "60%",
                height: "80%",
                background: "linear-gradient(180deg, transparent 0%, rgba(192, 132, 252, 0.25) 30%, rgba(255, 255, 255, 0.15) 50%, rgba(192, 132, 252, 0.25) 70%, transparent 100%)",
                filter: "blur(6px)",
              }}
            />
          </div>
          {/* Specular highlight */}
          <div
            className="absolute rounded-full"
            style={{
              top: "12%",
              left: "22%",
              width: "30%",
              height: "20%",
              background: "radial-gradient(ellipse, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 70%)",
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
              background: "radial-gradient(ellipse, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%)",
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
              animation: "orb-shadow 3s ease-in-out infinite",
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
              animation: `sparkle-orbit ${s.duration}s linear ${s.delay}s infinite`,
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
                animation: `sparkle-twinkle ${1.5 + i * 0.3}s ease-in-out infinite`,
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes orb-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes orb-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orb-shadow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }
          50% { transform: translateX(-50%) scale(0.8); opacity: 0.6; }
        }
        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.8);
            opacity: 0;
          }
        }
        @keyframes sparkle-orbit {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(var(--orbit-radius));
            opacity: 0;
          }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateX(var(--orbit-radius));
            opacity: 0;
          }
        }
        @keyframes sparkle-twinkle {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        @keyframes message-fade {
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
            animation: "message-fade 2.5s ease-in-out",
          }}
        >
          {MESSAGES[messageIndex]}
        </p>
      </div>

      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-12 px-5 py-2 rounded-pill font-body text-sm text-white/70 hover:text-white transition-colors"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
