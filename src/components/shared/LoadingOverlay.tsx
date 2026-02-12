interface LoadingOverlayProps {
  topic: string;
  difficulty: string;
  gameType?: "wordsearch" | "crossword";
}

export function LoadingOverlay({ topic, difficulty, gameType = "wordsearch" }: LoadingOverlayProps) {
  const gameLabel = gameType === "crossword" ? "crossword" : "word search";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      {/* 3D rotating orb */}
      <div className="relative w-20 h-20 mb-8" style={{ animation: "orb-float 3s ease-in-out infinite" }}>
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
      `}</style>

      <p className="font-heading text-lg text-white mb-2">
        Building your puzzle...
      </p>
      <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} {topic} {gameLabel}
      </p>
    </div>
  );
}
