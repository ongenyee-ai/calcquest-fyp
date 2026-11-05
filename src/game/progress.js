/**
 * Saved progress across sessions: which nodes are complete, stars, total XP
 * and the daily streak. Stored in the browser's localStorage for now; this is
 * the single place to swap in a database later.
 *
 * Every read and write is wrapped in try/catch because localStorage can be
 * unavailable (private windows, blocked storage). The game still runs; it
 * just forgets progress on reload.
 */

const KEY = 'calcquest.progress.v1';

export const EMPTY_PROGRESS = {
  completed: {},   // node id -> true
  stars: {},       // node id -> best stars (1–3)
  totalXp: 0,
  streak: { count: 0, lastDay: null },
};

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(EMPTY_PROGRESS);
    return { ...structuredClone(EMPTY_PROGRESS), ...JSON.parse(raw) };
  } catch {
    return structuredClone(EMPTY_PROGRESS);
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable: keep playing without saving */
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  return structuredClone(EMPTY_PROGRESS);
}

/** Local calendar day as YYYY-MM-DD (not UTC, so midnight in Singapore counts). */
export function today(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayBefore(day) {
  const [y, m, d] = day.split('-').map(Number);
  return today(new Date(y, m - 1, d - 1));
}

/**
 * Daily streak: practising on consecutive days adds one; practising again on
 * the same day changes nothing; missing a day resets the streak to 1.
 */
export function bumpStreak(streak, day = today()) {
  if (streak.lastDay === day) return streak;
  if (streak.lastDay === dayBefore(day)) return { count: streak.count + 1, lastDay: day };
  return { count: 1, lastDay: day };
}

/** Is the streak still alive today (practised today or yesterday)? */
export function displayedStreak(streak, day = today()) {
  if (streak.lastDay === day || streak.lastDay === dayBefore(day)) return streak.count;
  return 0;
}

export function recordNodeComplete(progress, nodeId, { stars = 0, xp = 0 } = {}) {
  return {
    ...progress,
    completed: { ...progress.completed, [nodeId]: true },
    stars: { ...progress.stars, [nodeId]: Math.max(progress.stars[nodeId] ?? 0, stars) },
    totalXp: progress.totalXp + xp,
    streak: bumpStreak(progress.streak),
  };
}
