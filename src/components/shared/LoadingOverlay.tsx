interface LoadingOverlayProps {
  topic: string;
  difficulty: string;
}

export function LoadingOverlay({ topic, difficulty }: LoadingOverlayProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      {/* Pulsing orb */}
      <div
        className="w-20 h-20 rounded-full mb-8 animate-pulse"
        style={{
          background:
            "radial-gradient(circle, #7B3FBF 0%, #5B2D8E 50%, transparent 70%)",
          boxShadow: "0 0 40px rgba(123, 63, 191, 0.4)",
        }}
      />

      <p className="font-heading text-lg text-white mb-2">
        Building your puzzle...
      </p>
      <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
        {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} {topic} word
        search
      </p>
    </div>
  );
}
