import type { MealType } from "@/generated/prisma/enums";

/** A calendar day as "YYYY-MM-DD", always in the user's time zone. */
export type DateKey = string;

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export const isValidTimeZone = (timeZone: string): boolean => {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
};

export const isDateKey = (value: unknown): value is DateKey => {
  if (typeof value !== "string") return false;
  const match = DATE_KEY.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  return date.toISOString().slice(0, 10) === value;
};

const parseKey = (key: DateKey) => {
  const [, y, m, d] = DATE_KEY.exec(key)!;
  return { year: +y, month: +m, day: +d };
};

const zonedParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
};

/** How far the zone is ahead of UTC at that moment, in ms. */
const zoneOffset = (date: Date, timeZone: string) => {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
};

export const dateKeyInZone = (date: Date, timeZone: string): DateKey => {
  const { year, month, day } = zonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export const hourInZone = (date: Date, timeZone: string): number => zonedParts(date, timeZone).hour;

export const addDays = (key: DateKey, days: number): DateKey => {
  const { year, month, day } = parseKey(key);
  return new Date(Date.UTC(year, month - 1, day) + days * DAY_MS).toISOString().slice(0, 10);
};

/** The UTC moment of a local wall-clock time; the second pass corrects across DST changes. */
export const zonedTimeToUtc = (key: DateKey, hour: number, timeZone: string): Date => {
  const { year, month, day } = parseKey(key);
  const wallClock = Date.UTC(year, month - 1, day, hour);
  const first = wallClock - zoneOffset(new Date(wallClock), timeZone);
  return new Date(wallClock - zoneOffset(new Date(first), timeZone));
};

/** [start, end) of a local day in UTC, for `eatenAt` range queries. */
export const dayRange = (key: DateKey, timeZone: string) => ({
  start: zonedTimeToUtc(key, 0, timeZone),
  end: zonedTimeToUtc(addDays(key, 1), 0, timeZone),
});

/** When an entry was eaten: now for today, otherwise noon of the chosen day. */
export const eatenAtFor = (key: DateKey, timeZone: string, now = new Date()): Date =>
  key === dateKeyInZone(now, timeZone) ? now : zonedTimeToUtc(key, 12, timeZone);

/** A sensible meal type for the time of day. */
export const mealTypeForHour = (hour: number): MealType => {
  if (hour >= 5 && hour < 11) return "BREAKFAST";
  if (hour >= 11 && hour < 16) return "LUNCH";
  if (hour >= 18 && hour < 22) return "DINNER";
  return "SNACK";
};

const dayFormat = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "היום", "אתמול", "מחר", or e.g. "יום שלישי, 10 בנובמבר". */
export const dayLabel = (key: DateKey, today: DateKey): string => {
  if (key === today) return "היום";
  if (key === addDays(today, -1)) return "אתמול";
  if (key === addDays(today, 1)) return "מחר";
  const { year, month, day } = parseKey(key);
  return dayFormat.format(new Date(Date.UTC(year, month - 1, day)));
};
