import { describe, expect, it } from "vitest";

import {
  addDays,
  dateKeyInZone,
  dayLabel,
  dayRange,
  eatenAtFor,
  isDateKey,
  isValidTimeZone,
  mealTypeForHour,
} from "@/lib/diary/dates";

const TZ = "Asia/Jerusalem";

describe("isDateKey", () => {
  it("accepts real calendar days only", () => {
    expect(isDateKey("2026-11-12")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-1-5")).toBe(false);
    expect(isDateKey(20261112)).toBe(false);
  });
});

describe("isValidTimeZone", () => {
  it("validates IANA zones", () => {
    expect(isValidTimeZone(TZ)).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("dayRange", () => {
  it("is the local day in UTC (winter, UTC+2)", () => {
    const { start, end } = dayRange("2026-11-12", TZ);
    expect(start.toISOString()).toBe("2026-11-11T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-12T22:00:00.000Z");
  });

  it("handles summer time (UTC+3) and the DST switch day", () => {
    expect(dayRange("2026-07-01", TZ).start.toISOString()).toBe("2026-06-30T21:00:00.000Z");
    // Israel moves clocks forward on 27 March 2026, so that day has 23 hours.
    const { start, end } = dayRange("2026-03-27", TZ);
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23);
  });
});

describe("dateKeyInZone", () => {
  it("uses the local calendar day", () => {
    const lateEvening = new Date("2026-11-12T23:30:00Z");
    expect(dateKeyInZone(lateEvening, TZ)).toBe("2026-11-13");
    expect(dateKeyInZone(lateEvening, "UTC")).toBe("2026-11-12");
  });
});

describe("eatenAtFor", () => {
  const now = new Date("2026-11-12T08:15:00Z");

  it("uses now for today and local noon for other days", () => {
    expect(eatenAtFor("2026-11-12", TZ, now)).toBe(now);
    expect(eatenAtFor("2026-11-10", TZ, now).toISOString()).toBe("2026-11-10T10:00:00.000Z");
  });
});

describe("mealTypeForHour", () => {
  it("maps the time of day to a meal", () => {
    expect(mealTypeForHour(7)).toBe("BREAKFAST");
    expect(mealTypeForHour(13)).toBe("LUNCH");
    expect(mealTypeForHour(17)).toBe("SNACK");
    expect(mealTypeForHour(19)).toBe("DINNER");
    expect(mealTypeForHour(23)).toBe("SNACK");
  });
});

describe("dayLabel", () => {
  it("names nearby days and formats others in Hebrew", () => {
    expect(dayLabel("2026-11-12", "2026-11-12")).toBe("היום");
    expect(dayLabel("2026-11-11", "2026-11-12")).toBe("אתמול");
    expect(dayLabel("2026-11-13", "2026-11-12")).toBe("מחר");
    expect(dayLabel("2026-11-10", "2026-11-12")).toContain("10 בנובמבר");
  });
});
