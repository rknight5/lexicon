"use client";

interface WordProgressProps {
  found: number;
  total: number;
}

export function WordProgress({ found, total }: WordProgressProps) {
  const pct = total > 0 ? (found / total) * 100 : 0;

  return (
    <div
      className="flex items-center"
      style={{ gap: 10, padding: "10px 18px 6px" }}
    >
      <div
        className="flex-1 overflow-hidden"
        style={{
          height: 3,
          background: "rgba(255, 255, 255, 0.06)",
          borderRadius: 2,
        }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #a78bfa, #f7c948)",
            borderRadius: 2,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "var(--font-ws-mono)",
          fontSize: 10,
          color: "var(--ws-text-dim)",
          whiteSpace: "nowrap",
        }}
      >
        {found}/{total}
      </span>
    </div>
  );
}
