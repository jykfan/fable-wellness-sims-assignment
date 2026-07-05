// ---------------------------------------------------------------------------
// Economy rules: reward payouts, the XP/level curve, and world gating.
// Pure functions only — no storage, no React — so these can move to a
// backend unchanged when rewards need to be granted server-side.
// ---------------------------------------------------------------------------

import worldsData from "../data/worlds.json";
import type { WorldDef } from "../types";

export const WORLDS = worldsData as WorldDef[];

/**
 * Upper bound on the payout a subscriber can assign to a custom task.
 * See DECISIONS.md — this is our answer to the spec's open question:
 * self-assigned values are allowed but clamped so the earned economy
 * keeps meaning. 50 is 10× the richest default task payout.
 */
export const CUSTOM_TASK_MAX_SPARKS = 50;

/** Fixed XP for completing any custom task, regardless of its Spark value.
 *  Keeps world/level progression standardized even though custom Spark
 *  payouts are player-chosen. */
export const CUSTOM_TASK_XP = 10;

export const SUBSCRIPTION_PRICE_CENTS = 1000; // $10/mo, per spec

// --- Reward payouts (free-tier defaults, per spec §5B examples) -----------

/** Guided meditation: 1 Spark per minute (5-min session → 5 Sparks). */
export function meditationReward(minutes: number): { sparks: number; xp: number } {
  const m = Math.max(1, Math.min(10, Math.round(minutes)));
  return { sparks: m, xp: m };
}

/** Breathing: flat 4 Sparks per completed set of BREATHING_CYCLES_PER_SET. */
export const BREATHING_CYCLES_PER_SET = 4;
export function breathingReward(sets: number): { sparks: number; xp: number } {
  const s = Math.max(1, Math.floor(sets));
  return { sparks: 4 * s, xp: 4 * s };
}

/** Meal log: 4 Sparks + streak bonus (+1 per consecutive day, capped +5). */
export function mealReward(streakDays: number): { sparks: number; xp: number } {
  const bonus = Math.min(5, Math.max(0, streakDays - 1));
  return { sparks: 4 + bonus, xp: 4 };
}

/** Exercise: 1 Spark per 2 minutes (10-min walk → 5 Sparks). */
export function exerciseReward(minutes: number): { sparks: number; xp: number } {
  const m = Math.max(1, Math.round(minutes));
  const sparks = Math.max(1, Math.round(m / 2));
  return { sparks, xp: sparks };
}

/** Gratitude / worry journal: flat 5 Sparks per entry. */
export function journalReward(): { sparks: number; xp: number } {
  return { sparks: 5, xp: 5 };
}

// --- Leveling curve --------------------------------------------------------

/** Cumulative XP required to *reach* a level: 20·(L−1)·L.
 *  L2=40, L3=120, L4=240, L5=400, L6=600, L7=840 … gentle quadratic. */
export function xpForLevel(level: number): number {
  return 20 * (level - 1) * level;
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

/** Progress toward the next level, 0..1, for the XP bar. */
export function levelProgress(xp: number): {
  level: number;
  into: number;
  needed: number;
  fraction: number;
} {
  const level = levelForXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const into = xp - floor;
  const needed = ceil - floor;
  return { level, into, needed, fraction: Math.min(1, into / needed) };
}

// --- Meal streak helpers ----------------------------------------------------

export function isoDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Next streak value given the previous streak record and today's date. */
export function nextMealStreak(
  prev: { lastDate: string | null; days: number },
  now: number
): { lastDate: string; days: number } {
  const today = isoDate(now);
  if (prev.lastDate === today) return { lastDate: today, days: prev.days };
  const yesterday = isoDate(now - 24 * 60 * 60 * 1000);
  const days = prev.lastDate === yesterday ? prev.days + 1 : 1;
  return { lastDate: today, days };
}
