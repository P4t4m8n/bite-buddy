import { z } from "zod";

import { barcodeSchema } from "@/lib/food/barcode";

export const FOOD_NAME_MAX = 100;
export const MAX_PACKAGE_AMOUNT = 50_000;
const MAX_KCAL = 900;
const MAX_GRAMS = 100;
/** Sodium is entered in mg (what labels show) and stored in grams. */
const MAX_SODIUM_MG = 100_000;

const requiredNumber = (label: string, max: number) =>
  z
    .number({ error: `יש להזין ${label}.` })
    .min(0, `${label} לא יכול להיות שלילי.`)
    .max(max, `${label} יכול להיות עד ${max}.`);

const optionalNumber = (label: string, max: number) => requiredNumber(label, max).nullable();

/** Body of POST /api/foods. Nutrients are per 100 g or 100 ml (see `unit`). */
export const customFoodSchema = z
  .object({
    name: z
      .string({ error: "יש להזין שם מוצר." })
      .trim()
      .min(1, "יש להזין שם מוצר.")
      .max(FOOD_NAME_MAX, `שם המוצר יכול להכיל עד ${FOOD_NAME_MAX} תווים.`),
    brands: z
      .string()
      .trim()
      .max(200)
      .default("")
      .transform((value) =>
        [...new Set(value.split(",").map((brand) => brand.trim()))].filter(Boolean),
      ),
    barcode: z
      .union([barcodeSchema, z.literal("")])
      .nullable()
      .default(null)
      .transform((value) => value || null),
    unit: z.enum(["G", "ML"], { error: "יחידה לא תקינה." }),
    packageAmount: z
      .number()
      .positive("גודל האריזה צריך להיות גדול מ־0.")
      .max(MAX_PACKAGE_AMOUNT)
      .nullable()
      .default(null),
    kcal100: requiredNumber("קלוריות", MAX_KCAL),
    protein100: requiredNumber("חלבונים", MAX_GRAMS),
    carbs100: requiredNumber("פחמימות", MAX_GRAMS),
    fat100: requiredNumber("שומנים", MAX_GRAMS),
    sugar100: optionalNumber("סוכרים", MAX_GRAMS).default(null),
    fiber100: optionalNumber("סיבים", MAX_GRAMS).default(null),
    satFat100: optionalNumber("שומן רווי", MAX_GRAMS).default(null),
    sodiumMg100: optionalNumber("נתרן", MAX_SODIUM_MG).default(null),
  })
  .refine((food) => food.protein100 + food.carbs100 + food.fat100 <= MAX_GRAMS, {
    error: "סך החלבונים, הפחמימות והשומנים לא יכול לעלות על 100.",
    path: ["fat100"],
  })
  .refine((food) => food.sugar100 === null || food.sugar100 <= food.carbs100, {
    error: "הסוכרים לא יכולים לעלות על הפחמימות.",
    path: ["sugar100"],
  })
  .refine((food) => food.satFat100 === null || food.satFat100 <= food.fat100, {
    error: "השומן הרווי לא יכול לעלות על השומנים.",
    path: ["satFat100"],
  });

export type CustomFoodInput = z.infer<typeof customFoodSchema>;

/** Food row fields for a custom food (createdById and source are added by the caller). */
export const toFoodData = (input: CustomFoodInput) => ({
  name: input.name,
  brands: input.brands,
  barcode: input.barcode,
  unit: input.unit,
  packageAmount: input.packageAmount,
  kcal100: input.kcal100,
  protein100: input.protein100,
  carbs100: input.carbs100,
  fat100: input.fat100,
  sugar100: input.sugar100,
  fiber100: input.fiber100,
  satFat100: input.satFat100,
  sodium100: input.sodiumMg100 === null ? null : input.sodiumMg100 / 1000,
  hasNutrition: true,
});

// ─── Form values ─────────────────────────────────────────────────────────────

export const FORM_NUMBER_FIELDS = [
  "packageAmount",
  "kcal100",
  "protein100",
  "carbs100",
  "fat100",
  "sugar100",
  "fiber100",
  "satFat100",
  "sodiumMg100",
] as const;

export type FormNumberField = (typeof FORM_NUMBER_FIELDS)[number];

/** The form keeps every field as text so partially typed numbers aren't lost. */
export type CustomFoodFormValues = {
  name: string;
  brands: string;
  barcode: string;
  unit: "G" | "ML";
} & Record<FormNumberField, string>;

type RawParam = string | string[] | undefined;

const first = (value: RawParam) => (Array.isArray(value) ? value[0] : value);

const numberText = (value: RawParam, scale = 1) => {
  const parsed = Number(first(value));
  if (!first(value) || !Number.isFinite(parsed) || parsed < 0) return "";
  return String(Math.round(parsed * scale * 100) / 100);
};

/**
 * Initial form values from the URL. The scan page links here with what Open Food Facts
 * knew (sodium in grams per 100); the search page passes just `name`.
 */
export const prefillFromSearchParams = (
  params: Record<string, RawParam>,
): CustomFoodFormValues => ({
  name: (first(params.name) ?? "").slice(0, FOOD_NAME_MAX),
  brands: first(params.brands) ?? "",
  barcode: /^\d{8,14}$/.test(first(params.barcode) ?? "") ? (first(params.barcode) as string) : "",
  unit: first(params.unit) === "ML" ? "ML" : "G",
  packageAmount: numberText(params.packageAmount),
  kcal100: numberText(params.kcal100),
  protein100: numberText(params.protein100),
  carbs100: numberText(params.carbs100),
  fat100: numberText(params.fat100),
  sugar100: numberText(params.sugar100),
  fiber100: numberText(params.fiber100),
  satFat100: numberText(params.satFat100),
  sodiumMg100: numberText(params.sodium100, 1000),
});

/** Turns form text into the API body (empty optional numbers → null). */
export const formValuesToBody = (values: CustomFoodFormValues) => {
  const num = (field: FormNumberField) => {
    const text = values[field].trim().replace(",", ".");
    return text === "" ? null : Number(text);
  };
  return {
    name: values.name,
    brands: values.brands,
    barcode: values.barcode.trim() || null,
    unit: values.unit,
    ...Object.fromEntries(FORM_NUMBER_FIELDS.map((field) => [field, num(field)])),
  };
};
