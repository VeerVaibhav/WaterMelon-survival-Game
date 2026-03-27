/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Color lerp: returns hex color between a and b at t [0..1] */
export function lerpColor(colorA: number, colorB: number, t: number): number {
  const ar = (colorA >> 16) & 0xff;
  const ag = (colorA >> 8) & 0xff;
  const ab = colorA & 0xff;
  const br = (colorB >> 16) & 0xff;
  const bg = (colorB >> 8) & 0xff;
  const bb = colorB & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const b = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | b;
}

/** Format number with commas */
export function formatNumber(n: number): string {
  return Math.floor(n).toLocaleString();
}

/** Format game-minutes as HH:MM */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  date: string;
  profileLink?: string;
}

/** Get leaderboard from localStorage */
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem('wms_leaderboard');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save leaderboard to localStorage */
export function saveLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    const top10 = [...entries].sort((a, b) => b.score - a.score).slice(0, 10);
    localStorage.setItem('wms_leaderboard', JSON.stringify(top10));
  } catch {
    // Storage unavailable
  }
}
