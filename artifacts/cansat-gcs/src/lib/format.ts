/**
 * Formatting helpers shared across GCS components.
 */

/**
 * Format mission elapsed time as  T+ HH:MM:SS
 *   e.g.  formatMissionTime(109)  →  "T+ 00:01:49"
 */
export function formatMissionTime(seconds: number): string {
  const s   = Math.floor(seconds);
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `T+ ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Format mission elapsed time as  T+mm:ss  for log entries
 *   e.g.  formatLogTime(109)  →  "T+01:49"
 */
export function formatLogTime(seconds: number): string {
  const s   = Math.floor(seconds);
  const m   = Math.floor(s / 60);
  const sec = s % 60;
  return `T+${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Format a graph X-axis tick (mission seconds) as  mm:ss
 *   e.g.  formatGraphTick(69)  →  "01:09"
 */
export function formatGraphTick(seconds: number): string {
  const s   = Math.floor(seconds);
  const m   = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
