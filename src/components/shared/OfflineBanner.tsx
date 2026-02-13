"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] flex items-center justify-center gap-2 py-2 text-xs font-body font-semibold"
      style={{
        background: "rgba(255, 64, 129, 0.9)",
        color: "white",
      }}
    >
      <WifiOff className="w-3.5 h-3.5" />
      You're offline — saved puzzles still available
    </div>
  );
}
