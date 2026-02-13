"use client";

interface WordProgressProps {
  found: number;
  total: number;
}

export function WordProgress({ found, total }: WordProgressProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-accent rounded-full transition-all duration-300"
          style={{ width: `${total > 0 ? (found / total) * 100 : 0}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white/70 font-body">
        {found}/{total}
      </span>
    </div>
  );
}
