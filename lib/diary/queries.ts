import "server-only";

import { db } from "@/lib/db";
import { dateKeyInZone, dayRange, isDateKey } from "@/lib/diary/dates";
import { MEAL_TYPES } from "@/lib/diary/schemas";
import { sumNutrients } from "@/lib/nutrition/nutrients";
import { getUserSettings } from "@/lib/user/settings";

import type { DiaryDay, DiaryEntry } from "@/lib/diary/types";

/** The user's diary for a local day (`date` defaults to today in their time zone). */
export const getDiaryDay = async (userId: string, date?: string): Promise<DiaryDay> => {
  const settings = await getUserSettings(userId);
  const today = dateKeyInZone(new Date(), settings.timezone);
  const day = isDateKey(date) ? date : today;
  const { start, end } = dayRange(day, settings.timezone);

  const rows = await db.logEntry.findMany({
    where: { userId, eatenAt: { gte: start, lt: end } },
    orderBy: [{ eatenAt: "asc" }, { createdAt: "asc" }],
    include: { food: { select: { unit: true } } },
  });

  const entries: DiaryEntry[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    mealType: row.mealType,
    foodId: row.foodId,
    mealId: row.mealId,
    amount: row.amount,
    unit: row.food?.unit ?? "G",
    servings: row.servings,
    nutrients: {
      kcal: row.kcal,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber,
      sugar: row.sugar,
      satFat: row.satFat,
      sodium: row.sodium,
    },
  }));

  const sections = MEAL_TYPES.map((mealType) => {
    const sectionEntries = entries.filter((entry) => entry.mealType === mealType);
    return {
      mealType,
      entries: sectionEntries,
      totals: sumNutrients(sectionEntries.map((entry) => entry.nutrients)),
    };
  });

  return {
    date: day,
    today,
    timezone: settings.timezone,
    sections,
    totals: sumNutrients(entries.map((entry) => entry.nutrients)),
    goals: settings.goals,
  };
};
