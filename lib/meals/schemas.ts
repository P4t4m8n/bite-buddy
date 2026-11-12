import { z } from "zod";

import { MAX_AMOUNT } from "@/lib/nutrition/amount";

export const MEAL_NAME_MAX = 80;
export const MEAL_NOTES_MAX = 500;
export const MEAL_ITEMS_MAX = 50;

const nameSchema = z
  .string({ error: "יש להזין שם לארוחה." })
  .trim()
  .min(1, "יש להזין שם לארוחה.")
  .max(MEAL_NAME_MAX, `שם הארוחה יכול להכיל עד ${MEAL_NAME_MAX} תווים.`);

// An empty note is stored as null.
const notesSchema = z
  .string({ error: "הערות לא תקינות." })
  .trim()
  .max(MEAL_NOTES_MAX, `ההערות יכולות להכיל עד ${MEAL_NOTES_MAX} תווים.`)
  .nullable()
  .transform((value) => value || null);

const visibilitySchema = z.enum(["PRIVATE", "PUBLIC"], { error: "סוג שיתוף לא תקין." });

export const mealItemInputSchema = z.object({
  foodId: z.string({ error: "מוצר לא תקין." }).trim().min(1, "מוצר לא תקין.").max(64),
  amount: z
    .number({ error: "כמות לא תקינה." })
    .positive("הכמות צריכה להיות גדולה מ־0.")
    .max(MAX_AMOUNT, `הכמות יכולה להיות עד ${MAX_AMOUNT}.`),
});

const itemsSchema = z
  .array(mealItemInputSchema, { error: "רשימת מוצרים לא תקינה." })
  .max(MEAL_ITEMS_MAX, `ארוחה יכולה להכיל עד ${MEAL_ITEMS_MAX} מוצרים.`);

export const createMealSchema = z.object({
  name: nameSchema,
  notes: notesSchema.optional().transform((value) => value ?? null),
  visibility: visibilitySchema.default("PRIVATE"),
  items: itemsSchema.default([]),
});

/** PATCH body: every field is optional; `items` replaces the whole list in the given order. */
export const updateMealSchema = z
  .object({
    name: nameSchema.optional(),
    notes: notesSchema.optional(),
    visibility: visibilitySchema.optional(),
    items: itemsSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    error: "אין שינויים לשמירה.",
  });

export type MealItemInput = z.infer<typeof mealItemInputSchema>;
export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
