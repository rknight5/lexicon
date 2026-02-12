"use client";

import { useRouter } from "next/navigation";

export function SessionExpiredModal() {
  const router = useRouter();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-5"
      style={{ background: "var(--overlay-dark)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-sm rounded-card p-6 space-y-4 text-center"
        style={{
          background: "linear-gradient(135deg, #2D1B69 0%, #5B2D8E 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        }}
      >
        <h2 className="font-heading text-xl font-bold">Session Expired</h2>
        <p className="font-body text-sm" style={{ color: "var(--white-muted)" }}>
          Your session has ended. Log in again to keep saving your progress.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full h-11 rounded-pill font-heading text-sm font-bold uppercase tracking-wider text-purple-deep transition-all hover:-translate-y-0.5 active:scale-[0.97]"
          style={{
            background: "linear-gradient(180deg, #FFD700 0%, #E5A100 100%)",
            boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
          }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
