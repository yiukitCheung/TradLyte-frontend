/** Mirrors `compute_reward_level` in `*_profile_rewards_triggers.sql`. */

export const POINTS_PER_JOURNAL_ENTRY = 25;
export const POINTS_PER_NEW_GOAL = 50;

export function rewardLevelFromPoints(points: number): number {
  const p = Math.max(0, Math.floor(Number(points)) || 0);
  if (p < 100) return 1;
  if (p < 250) return 2;
  if (p < 450) return 3;
  if (p < 700) return 4;
  if (p < 1000) return 5;
  if (p < 1400) return 6;
  if (p < 1900) return 7;
  if (p < 2500) return 8;
  if (p < 3200) return 9;
  return Math.min(20, 10 + Math.floor((p - 3200) / 800) + 1);
}

/** Smallest score strictly above current that yields a higher level (simple scan — fine for UX). */
export function nextLevelThresholdPoints(currentPoints: number): number | null {
  const lvl = rewardLevelFromPoints(currentPoints);
  if (lvl >= 20) return null;
  const p = Math.max(0, Math.floor(Number(currentPoints)) || 0);
  for (let step = 1; step <= 10000; step++) {
    if (rewardLevelFromPoints(p + step) > lvl) return p + step;
  }
  return null;
}
