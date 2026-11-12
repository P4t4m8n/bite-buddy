import "server-only";

import { db } from "@/lib/db";
import { eatenAtFor } from "@/lib/diary/dates";
import { getVisibleFood } from "@/lib/food/search";
import { getVisibleMeal } from "@/lib/meals/queries";
import { foodPer100, mealNutrition, multiply, scale } from "@/lib/nutrition/nutrients";

import type { CreateLogEntryInput, UpdateLogEntryInput } from "@/lib/diary/schemas";
import type { Nutrients } from "@/lib/nutrition/types";

export type LogWriteResult =
  { ok: true; id: string } | { ok: false; error: "not_found" | "invalid_target" };

const snapshotColumns = (n: Nutrients) => ({
  kcal: n.kcal,
  protein: n.protein,
  carbs: n.carbs,
  fat: n.fat,
  fiber: n.fiber,
  sugar: n.sugar,
  satFat: n.satFat,
  sodium: n.sodium,
});

/** Resolves the user's time zone; a valid zone from the browser replaces the stored one. */
const resolveTimeZone = async (userId: string, browserZone?: string) => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { timezone: true },
  });
  if (browserZone && browserZone !== user.timezone) {
    await db.user.update({ where: { id: userId }, data: { timezone: browserZone } });
    return browserZone;
  }
  return user.timezone;
};

/**
 * Logs a food or a meal. Nutrients are copied into the entry (a snapshot),
 * so later edits to the food or meal don't change past days.
 */
export const createLogEntry = async (
  userId: string,
  input: CreateLogEntryInput,
): Promise<LogWriteResult> => {
  let name: string;
  let nutrients: Nutrients;

  if (input.foodId && input.amount !== undefined) {
    const food = await getVisibleFood(input.foodId, userId);
    if (!food) return { ok: false, error: "invalid_target" };
    name = food.name;
    nutrients = scale(foodPer100(food), input.amount);
  } else if (input.mealId && input.servings !== undefined) {
    const meal = await getVisibleMeal(input.mealId, userId);
    if (!meal) return { ok: false, error: "invalid_target" };
    name = meal.name;
    nutrients = multiply(mealNutrition(meal.items).totals.values, input.servings);
  } else {
    return { ok: false, error: "invalid_target" };
  }

  const timeZone = await resolveTimeZone(userId, input.timezone);
  const entry = await db.logEntry.create({
    data: {
      userId,
      name,
      mealType: input.mealType,
      eatenAt: eatenAtFor(input.date, timeZone),
      foodId: input.foodId ?? null,
      amount: input.amount ?? null,
      mealId: input.mealId ?? null,
      servings: input.servings ?? null,
      ...snapshotColumns(nutrients),
    },
    select: { id: true },
  });
  return { ok: true, id: entry.id };
};

/**
 * A new amount or servings scales the stored snapshot by the same factor, so the entry
 * stays correct even if the food or meal was edited or deleted since it was logged.
 */
export const updateLogEntry = async (
  id: string,
  userId: string,
  input: UpdateLogEntryInput,
): Promise<LogWriteResult> => {
  const entry = await db.logEntry.findFirst({ where: { id, userId } });
  if (!entry) return { ok: false, error: "not_found" };

  let factor = 1;
  if (input.amount !== undefined) {
    if (entry.amount === null || entry.amount <= 0) return { ok: false, error: "invalid_target" };
    factor = input.amount / entry.amount;
  } else if (input.servings !== undefined) {
    if (entry.servings === null || entry.servings <= 0)
      return { ok: false, error: "invalid_target" };
    factor = input.servings / entry.servings;
  }

  const current: Nutrients = {
    kcal: entry.kcal,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    fiber: entry.fiber,
    sugar: entry.sugar,
    satFat: entry.satFat,
    sodium: entry.sodium,
  };

  await db.logEntry.update({
    where: { id },
    data: {
      mealType: input.mealType,
      amount: input.amount,
      servings: input.servings,
      ...(factor === 1 ? {} : snapshotColumns(multiply(current, factor))),
    },
  });
  return { ok: true, id };
};

export const deleteLogEntry = async (id: string, userId: string): Promise<LogWriteResult> => {
  const { count } = await db.logEntry.deleteMany({ where: { id, userId } });
  return count === 0 ? { ok: false, error: "not_found" } : { ok: true, id };
};
