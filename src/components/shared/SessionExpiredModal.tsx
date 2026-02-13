"use client";

import { useRouter } from "next/navigation";
import { ModalShell } from "@/components/shared/ModalShell";

export function SessionExpiredModal() {
  const router = useRouter();

  return (
    <ModalShell zClass="z-[60]" centered>
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
    </ModalShell>
  );
}
