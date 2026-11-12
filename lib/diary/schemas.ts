import { z } from "zod";

import { isDateKey, isValidTimeZone } from "@/lib/diary/dates";
import { MAX_AMOUNT } from "@/lib/nutrition/amount";

import type { MealType } from "@/generated/prisma/enums";

export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const satisfies MealType[];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: "ארוחת בוקר",
  LUNCH: "ארוחת צהריים",
  DINNER: "ארוחת ערב",
  SNACK: "נשנושים",
};

export const MAX_SERVINGS = 20;

const mealTypeSchema = z.enum(MEAL_TYPES, { error: "סוג ארוחה לא תקין." });

const amountSchema = z
  .number({ error: "כמות לא תקינה." })
  .positive("הכמות צריכה להיות גדולה מ־0.")
  .max(MAX_AMOUNT, `הכמות יכולה להיות עד ${MAX_AMOUNT}.`);

const servingsSchema = z
  .number({ error: "מספר מנות לא תקין." })
  .positive("מספר המנות צריך להיות גדול מ־0.")
  .max(MAX_SERVINGS, `אפשר לרשום עד ${MAX_SERVINGS} מנות.`);

export const timeZoneSchema = z
  .string()
  .max(64)
  .refine(isValidTimeZone, { error: "אזור זמן לא תקין." });

/** POST /api/log — logs either a food (with an amount) or a meal (with servings). */
export const createLogEntrySchema = z
  .object({
    date: z.string().refine(isDateKey, { error: "תאריך לא תקין." }),
    mealType: mealTypeSchema,
    timezone: timeZoneSchema.optional(),
    foodId: z.string().min(1).max(64).optional(),
    amount: amountSchema.optional(),
    mealId: z.string().min(1).max(64).optional(),
    servings: servingsSchema.optional(),
  })
  .superRefine((body, ctx) => {
    const isFood = body.foodId !== undefined && body.amount !== undefined;
    const isMeal = body.mealId !== undefined && body.servings !== undefined;
    if (isFood === isMeal) {
      ctx.addIssue({ code: "custom", message: "יש לבחור מוצר עם כמות או ארוחה עם מספר מנות." });
    }
  });

/** PATCH /api/log/[id] — change the amount (food), servings (meal) or meal type. */
export const updateLogEntrySchema = z
  .object({
    amount: amountSchema.optional(),
    servings: servingsSchema.optional(),
    mealType: mealTypeSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    error: "אין שינויים לשמירה.",
  });

export type CreateLogEntryInput = z.infer<typeof createLogEntrySchema>;
export type UpdateLogEntryInput = z.infer<typeof updateLogEntrySchema>;
