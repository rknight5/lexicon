"use client";

interface CountdownTimerProps {
  timeRemaining: number; // ms
  timeTotal: number; // ms
  running: boolean;
  size?: number;
}

export function CountdownTimer({
  timeRemaining,
  timeTotal,
  running,
  size = 80,
}: CountdownTimerProps) {
  const seconds = Math.ceil(timeRemaining / 1000);
  const fraction = timeTotal > 0 ? timeRemaining / timeTotal : 1;

  // SVG circle math
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  // Color based on fraction remaining: gold normal, red under ~5s
  const color = fraction > 0.25 ? "#FFD700" : "#ff4d6a";

  const pulseClass = running && seconds <= 5 && seconds > 0 ? "animate-timer-pulse" : "";

  return (
    <div
      className={`relative flex items-center justify-center ${pulseClass}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Active arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.1s linear, stroke 0.3s ease",
          }}
        />
      </svg>
      {/* Center seconds */}
      <span
        className="absolute font-grid font-bold"
        style={{
          fontSize: size * 0.35,
          color,
          transition: "color 0.3s ease",
        }}
      >
        {seconds}
      </span>
    </div>
  );
}
