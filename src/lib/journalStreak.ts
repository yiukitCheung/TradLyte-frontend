import { format, parseISO } from "date-fns";

function ymd(ts: string | null | undefined): string | null {
  if (!ts || typeof ts !== "string") return null;
  try {
    return format(parseISO(ts), "yyyy-MM-dd");
  } catch {
    return null;
  }
}

/** Consecutive UTC calendar days ending at `reference` (today by default). */
export function consecutiveJournalDays(
  timestamps: Array<string | null | undefined>,
  reference: Date = new Date(),
): number {
  const days = [...new Set(timestamps.map(ymd).filter((x): x is string => Boolean(x)))];
  const set = new Set(days);
  if (set.size === 0) return 0;
  let d = reference;
  const todayKey = format(d, "yyyy-MM-dd");
  if (!set.has(todayKey)) {
    const y = new Date(d);
    y.setDate(y.getDate() - 1);
    d = y;
  }
  let streak = 0;
  while (true) {
    const key = format(d, "yyyy-MM-dd");
    if (set.has(key)) {
      streak += 1;
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 1);
      d = prev;
      continue;
    }
    break;
  }
  return streak;
}
