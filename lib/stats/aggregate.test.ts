import { describe, expect, it } from "vitest";

import {
  dailyTotals,
  isOnTarget,
  loggingStreak,
  summarizeWeek,
  topFoods,
  weekStartOf,
  weeklyTrend,
  type StatsEntry,
} from "@/lib/stats/aggregate";

const TZ = "Asia/Jerusalem";

const entry = (iso: string, name: string, kcal: number, protein = 0): StatsEntry => ({
  eatenAt: new Date(iso),
  name,
  kcal,
  protein,
  carbs: 0,
  fat: null,
});

describe("weekStartOf", () => {
  // 2026-11-12 is a Thursday.
  it("finds Sunday- and Monday-based week starts", () => {
    expect(weekStartOf("2026-11-12", "SUNDAY")).toBe("2026-11-08");
    expect(weekStartOf("2026-11-12", "MONDAY")).toBe("2026-11-09");
    expect(weekStartOf("2026-11-08", "SUNDAY")).toBe("2026-11-08");
    expect(weekStartOf("2026-11-08", "MONDAY")).toBe("2026-11-02");
  });
});

describe("dailyTotals", () => {
  it("groups by local day and fills empty days", () => {
    const days = dailyTotals(
      [
        entry("2026-11-08T10:00:00Z", "a", 500, 20),
        // 23:30 UTC on the 8th is already the 9th in Israel.
        entry("2026-11-08T23:30:00Z", "b", 300),
        entry("2026-11-09T09:00:00Z", "c", 200),
      ],
      TZ,
      "2026-11-08",
      "2026-11-10",
    );
    expect(days.map((d) => [d.date, d.kcal, d.logged])).toEqual([
      ["2026-11-08", 500, true],
      ["2026-11-09", 500, true],
      ["2026-11-10", 0, false],
    ]);
    expect(days[0].protein).toBe(20);
  });
});

describe("summarizeWeek", () => {
  it("averages over logged days only", () => {
    const days = dailyTotals(
      [entry("2026-11-08T10:00:00Z", "a", 1800), entry("2026-11-10T10:00:00Z", "b", 2200)],
      TZ,
      "2026-11-08",
      "2026-11-14",
    );
    const summary = summarizeWeek(days);
    expect(summary.totals.kcal).toBe(4000);
    expect(summary.averages.kcal).toBe(2000);
    expect(summary.loggedDays).toBe(2);
  });

  it("is all zeros for an empty week", () => {
    expect(summarizeWeek(dailyTotals([], TZ, "2026-11-08", "2026-11-14")).averages.kcal).toBe(0);
  });
});

describe("weeklyTrend", () => {
  it("returns the last N weeks oldest first", () => {
    const trend = weeklyTrend(
      [entry("2026-11-01T10:00:00Z", "a", 1500), entry("2026-11-09T10:00:00Z", "b", 2500)],
      TZ,
      "2026-11-08",
      3,
    );
    expect(trend.map((w) => [w.weekStart, w.kcal])).toEqual([
      ["2026-10-25", 0],
      ["2026-11-01", 1500],
      ["2026-11-08", 2500],
    ]);
  });
});

describe("isOnTarget", () => {
  const goals = { kcal: 2000, proteinG: 0, carbsG: 0, fatG: 0 };
  it("is within ±10% of the calorie goal on logged days", () => {
    const day = { date: "2026-11-08", logged: true, kcal: 2150, protein: 0, carbs: 0, fat: 0 };
    expect(isOnTarget(day, goals)).toBe(true);
    expect(isOnTarget({ ...day, kcal: 2300 }, goals)).toBe(false);
    expect(isOnTarget({ ...day, kcal: 0, logged: false }, goals)).toBe(false);
  });
});

describe("loggingStreak", () => {
  it("counts back from today, or from yesterday when today is empty", () => {
    const days = new Set(["2026-11-10", "2026-11-11", "2026-11-12"]);
    expect(loggingStreak(days, "2026-11-12")).toBe(3);
    expect(loggingStreak(days, "2026-11-13")).toBe(3);
    expect(loggingStreak(days, "2026-11-14")).toBe(0);
  });
});

describe("topFoods", () => {
  it("ranks by total calories", () => {
    const top = topFoods([
      entry("2026-11-08T10:00:00Z", "חלב", 100),
      entry("2026-11-09T10:00:00Z", "חלב", 100),
      entry("2026-11-09T11:00:00Z", "קוטג'", 150),
    ]);
    expect(top).toEqual([
      { name: "חלב", kcal: 200, count: 2 },
      { name: "קוטג'", kcal: 150, count: 1 },
    ]);
  });
});
