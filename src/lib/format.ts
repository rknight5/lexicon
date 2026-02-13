/**
 * Format elapsed seconds as M:SS or MM:SS.
 * @param padMinutes  If true, zero-pad minutes to 2 digits (e.g. "01:05"). Default: false.
 */
export function formatTime(seconds: number, padMinutes = false): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mins = padMinutes ? m.toString().padStart(2, "0") : m.toString();
  return `${mins}:${s.toString().padStart(2, "0")}`;
}
