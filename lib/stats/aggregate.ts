import { addDays, dateKeyInZone } from "@/lib/diary/dates";

import type { WeekStart } from "@/generated/prisma/enums";
import type { DateKey } from "@/lib/diary/dates";
import type { GoalValues } from "@/lib/goals/goals";

/** A logged entry reduced to what stats need. */
export type StatsEntry = {
  eatenAt: Date;
  name: string;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

export type Macros = { kcal: number; protein: number; carbs: number; fat: number };

export type DayStats = Macros & { date: DateKey; logged: boolean };

const zero = (): Macros => ({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

const addEntry = (total: Macros, entry: StatsEntry) => {
  total.kcal += entry.kcal ?? 0;
  total.protein += entry.protein ?? 0;
  total.carbs += entry.carbs ?? 0;
  total.fat += entry.fat ?? 0;
};

/** The first day of the week containing `date` (Sunday- or Monday-based). */
export const weekStartOf = (date: DateKey, weekStartsOn: WeekStart): DateKey => {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  const offset = weekStartsOn === "SUNDAY" ? weekday : (weekday + 6) % 7;
  return addDays(date, -offset);
};

/** Totals per local day for every day in [from, to], including days with nothing logged. */
export const dailyTotals = (
  entries: StatsEntry[],
  timeZone: string,
  from: DateKey,
  to: DateKey,
): DayStats[] => {
  const byDay = new Map<DateKey, Macros>();
  for (const entry of entries) {
    const key = dateKeyInZone(entry.eatenAt, timeZone);
    if (key < from || key > to) continue;
    const total = byDay.get(key) ?? zero();
    addEntry(total, entry);
    byDay.set(key, total);
  }

  const days: DayStats[] = [];
  for (let key = from; key <= to; key = addDays(key, 1)) {
    const total = byDay.get(key);
    days.push({ date: key, logged: Boolean(total), ...(total ?? zero()) });
  }
  return days;
};

export type WeekSummary = {
  totals: Macros;
  /** Average over the days that have entries (not counting empty days). */
  averages: Macros;
  loggedDays: number;
};

export const summarizeWeek = (days: DayStats[]): WeekSummary => {
  const logged = days.filter((day) => day.logged);
  const totals = zero();
  for (const day of logged) {
    totals.kcal += day.kcal;
    totals.protein += day.protein;
    totals.carbs += day.carbs;
    totals.fat += day.fat;
  }
  const n = Math.max(logged.length, 1);
  return {
    totals,
    averages: {
      kcal: totals.kcal / n,
      protein: totals.protein / n,
      carbs: totals.carbs / n,
      fat: totals.fat / n,
    },
    loggedDays: logged.length,
  };
};

export type WeekTrendPoint = Macros & { weekStart: DateKey; loggedDays: number };

/** Average daily macros (over logged days) for each of the last `weeks` weeks, oldest first. */
export const weeklyTrend = (
  entries: StatsEntry[],
  timeZone: string,
  currentWeekStart: DateKey,
  weeks: number,
): WeekTrendPoint[] =>
  Array.from({ length: weeks }, (_, i) => {
    const start = addDays(currentWeekStart, -7 * (weeks - 1 - i));
    const { averages, loggedDays } = summarizeWeek(
      dailyTotals(entries, timeZone, start, addDays(start, 6)),
    );
    return { weekStart: start, loggedDays, ...averages };
  });

/** Within ±10% of the calorie goal. */
export const ON_TARGET_TOLERANCE = 0.1;

export const isOnTarget = (day: DayStats, goals: GoalValues): boolean =>
  day.logged && Math.abs(day.kcal - goals.kcal) <= goals.kcal * ON_TARGET_TOLERANCE;

/** Consecutive days with at least one entry, ending today (or yesterday if today is empty). */
export const loggingStreak = (loggedDays: Set<DateKey>, today: DateKey): number => {
  let day = loggedDays.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (loggedDays.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
};

export type TopFood = { name: string; kcal: number; count: number };

/** Foods and meals that added the most calories. */
export const topFoods = (entries: StatsEntry[], limit = 5): TopFood[] => {
  const byName = new Map<string, TopFood>();
  for (const entry of entries) {
    const item = byName.get(entry.name) ?? { name: entry.name, kcal: 0, count: 0 };
    item.kcal += entry.kcal ?? 0;
    item.count += 1;
    byName.set(entry.name, item);
  }
  return [...byName.values()].sort((a, b) => b.kcal - a.kcal).slice(0, limit);
};
