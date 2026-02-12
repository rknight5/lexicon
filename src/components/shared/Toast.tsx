"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ToastProps {
  message: string;
  icon?: React.ReactNode;
  duration?: number;
  onDismiss: () => void;
}

export function Toast({ message, icon, duration = 3000, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Enter animation: trigger on next frame after mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-dismiss after duration
  useEffect(() => {
    dismissTimerRef.current = setTimeout(() => {
      setExiting(true);
      // Wait for exit animation (200ms) then call onDismiss
      exitTimerRef.current = setTimeout(() => {
        onDismiss();
      }, 200);
    }, duration);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [duration, onDismiss]);

  const toast = (
    <div
      className="fixed bottom-6 left-1/2 z-[60] flex items-center gap-2 h-12 px-5 rounded-pill border font-body text-sm pointer-events-none"
      style={{
        transform: `translateX(-50%) translateY(${visible && !exiting ? "0px" : "20px"})`,
        opacity: visible && !exiting ? 1 : 0,
        transition: "transform 200ms ease-out, opacity 200ms ease-out",
        background: "var(--glass-bg)",
        borderColor: "var(--glass-border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "rgba(255, 255, 255, 0.9)",
      }}
    >
      {icon && <span className="flex-shrink-0 flex items-center">{icon}</span>}
      <span>{message}</span>
    </div>
  );

  return createPortal(toast, document.body);
}
