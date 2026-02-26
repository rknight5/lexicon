import { useEffect } from "react";
import confetti from "canvas-confetti";

/**
 * Fires confetti once on mount. Bigger burst for perfect games (3 lives).
 */
export function useWinConfetti(livesRemaining: number) {
  useEffect(() => {
    if (livesRemaining === 3) {
      confetti({ particleCount: 200, spread: 80, origin: { y: 0.5 } });
    } else {
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
    }
  }, []);
}
