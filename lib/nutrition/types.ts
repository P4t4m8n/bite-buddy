import { FoodSource, FoodUnit } from "@/generated/prisma/client";

/** Nutrients the app stores per food and per log entry. */
export const NUTRIENT_KEYS = [
  "kcal",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "satFat",
  "sodium",
] as const;

/** Nutrients users set goals for (macros only for now). */
export const MACRO_KEYS = ["kcal", "protein", "carbs", "fat"] as const;

export type NutrientKey = (typeof NUTRIENT_KEYS)[number];
export type MacroKey = (typeof MACRO_KEYS)[number];

/** kcal in kcal, everything else (including sodium) in grams. null means unknown, not 0. */
export type Nutrients = Record<NutrientKey, number | null>;

/** A sum of several items. `incomplete` lists nutrients that some items didn't have. */
export type NutrientTotals = {
  values: Nutrients;
  incomplete: NutrientKey[];
};

/** Per-100 g/ml nutrient columns of the Food model. */
export type FoodNutrition = {
  kcal100: number | null;
  protein100: number | null;
  carbs100: number | null;
  fat100: number | null;
  fiber100: number | null;
  sugar100: number | null;
  satFat100: number | null;
  sodium100: number | null;
};

export type MacroSplit = { protein: number; carbs: number; fat: number };

export type Food = {
  id: string;
  barcode: string | null;
  name: string;
  brands: string[];
  categories: string[];
  imageUrl: string | null;
  unit: FoodUnit;
  packageAmount: number | null;
  kcal100: number | null;
  protein100: number | null;
  carbs100: number | null;
  fat100: number | null;
  sugar100: number | null;
  fiber100: number | null;
  satFat100: number | null;
  salt100: number | null;
  sodium100: number | null;
  hasNutrition: boolean;
  nutritionGrade: string | null;
  novaGroup: number | null;
  allergens: string[];
  source: FoodSource;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
};
