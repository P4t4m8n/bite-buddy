import "server-only";

import { db } from "@/lib/db";
import { addDays, dateKeyInZone, dayRange, isDateKey } from "@/lib/diary/dates";
import {
  dailyTotals,
  isOnTarget,
  loggingStreak,
  summarizeWeek,
  topFoods,
  weeklyTrend,
  weekStartOf,
} from "@/lib/stats/aggregate";
import { getUserSettings } from "@/lib/user/settings";

import type { WeekStart } from "@/generated/prisma/enums";
import type { DateKey } from "@/lib/diary/dates";
import type { DayStats, TopFood, WeekSummary, WeekTrendPoint } from "@/lib/stats/aggregate";
import type { UserGoals } from "@/lib/user/settings";

export const TREND_WEEKS = 8;
const STREAK_LOOKBACK_DAYS = 120;

export type WeeklyStats = {
  weekStart: DateKey;
  weekEnd: DateKey;
  today: DateKey;
  isCurrentWeek: boolean;
  weekStartsOn: WeekStart;
  days: DayStats[];
  summary: WeekSummary;
  goals: UserGoals | null;
  onTargetDays: number | null;
  trend: WeekTrendPoint[];
  topFoods: TopFood[];
  streak: number;
};

/**
 * Stats for the week containing `week` (any day in it; defaults to this week). Entries
 * are loaded once and grouped by local day in JS: a user logs a few entries a day,
 * so a few months of data is small.
 */
export const getWeeklyStats = async (userId: string, week?: string): Promise<WeeklyStats> => {
  const { timezone, weekStartsOn, goals } = await getUserSettings(userId);
  const today = dateKeyInZone(new Date(), timezone);
  const currentWeekStart = weekStartOf(today, weekStartsOn);
  const requested = isDateKey(week) ? weekStartOf(week, weekStartsOn) : currentWeekStart;
  const weekStart = requested > currentWeekStart ? currentWeekStart : requested;
  const weekEnd = addDays(weekStart, 6);

  const trendStart = addDays(weekStart, -7 * (TREND_WEEKS - 1));
  const streakStart = addDays(today, -STREAK_LOOKBACK_DAYS);
  const from = trendStart < streakStart ? trendStart : streakStart;
  const to = weekEnd > today ? weekEnd : today;

  const entries = await db.logEntry.findMany({
    where: {
      userId,
      eatenAt: { gte: dayRange(from, timezone).start, lt: dayRange(to, timezone).end },
    },
    select: { eatenAt: true, name: true, kcal: true, protein: true, carbs: true, fat: true },
  });

  const days = dailyTotals(entries, timezone, weekStart, weekEnd);
  const weekEntries = entries.filter((entry) => {
    const key = dateKeyInZone(entry.eatenAt, timezone);
    return key >= weekStart && key <= weekEnd;
  });
  const loggedDays = new Set(entries.map((entry) => dateKeyInZone(entry.eatenAt, timezone)));

  return {
    weekStart,
    weekEnd,
    today,
    isCurrentWeek: weekStart === currentWeekStart,
    weekStartsOn,
    days,
    summary: summarizeWeek(days),
    goals,
    onTargetDays: goals ? days.filter((day) => isOnTarget(day, goals)).length : null,
    trend: weeklyTrend(entries, timezone, weekStart, TREND_WEEKS),
    topFoods: topFoods(weekEntries),
    streak: loggingStreak(loggedDays, today),
  };
};
