import {
  NUTRIENT_KEYS,
  type FoodNutrition,
  type MacroSplit,
  type NutrientKey,
  type NutrientTotals,
  type Nutrients,
} from "@/lib/nutrition/types";

const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const;

const mapNutrients = (fn: (key: NutrientKey) => number | null): Nutrients =>
  Object.fromEntries(NUTRIENT_KEYS.map((key) => [key, fn(key)])) as Nutrients;

const assertAmount = (amount: number, label: string) => {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new RangeError(`${label} must be a finite number >= 0, got ${amount}`);
  }
};

/** The per-100 g/ml values of a food as a Nutrients object. */
export const foodPer100 = (food: FoodNutrition): Nutrients => ({
  kcal: food.kcal100,
  protein: food.protein100,
  carbs: food.carbs100,
  fat: food.fat100,
  fiber: food.fiber100,
  sugar: food.sugar100,
  satFat: food.satFat100,
  sodium: food.sodium100,
});

/** Multiplies every known value by `factor`; unknown values stay null. */
export const multiply = (nutrients: Nutrients, factor: number): Nutrients => {
  assertAmount(factor, "factor");
  return mapNutrients((key) => {
    const value = nutrients[key];
    return value === null ? null : value * factor;
  });
};

/** Nutrients for `amount` g/ml of a food whose values are per 100 g/ml. */
export const scale = (per100: Nutrients, amount: number): Nutrients => {
  assertAmount(amount, "amount");
  return multiply(per100, amount / 100);
};

/**
 * Adds up items. A nutrient's total is the sum of the known values; it is listed
 * in `incomplete` when some items don't have it, and is null when none do.
 */
export const sumNutrients = (items: Nutrients[]): NutrientTotals => {
  const incomplete: NutrientKey[] = [];
  const values = mapNutrients((key) => {
    const known = items.map((item) => item[key]).filter((v): v is number => v !== null);
    if (known.length < items.length) incomplete.push(key);
    if (items.length === 0) return 0;
    return known.length === 0 ? null : known.reduce((sum, v) => sum + v, 0);
  });
  return { values, incomplete };
};

export type MealItemInput = { food: FoodNutrition; amount: number };

export type MealNutrition = {
  /** Nutrients of each item, in the same order as the input. */
  items: Nutrients[];
  totals: NutrientTotals;
  /** Total weight/volume of the meal in g/ml (1 ml counted as 1 g). */
  totalAmount: number;
};

export const mealNutrition = (items: MealItemInput[]): MealNutrition => {
  const itemNutrients = items.map(({ food, amount }) => scale(foodPer100(food), amount));
  return {
    items: itemNutrients,
    totals: sumNutrients(itemNutrients),
    totalAmount: items.reduce((sum, { amount }) => sum + amount, 0),
  };
};

/**
 * Share of calories from protein, carbs and fat, in percent (adds up to 100).
 * Based on 4/4/9 kcal per gram, not the label kcal. null when a macro is unknown
 * or there are no calories from macros.
 */
export const macroSplit = (nutrients: Nutrients): MacroSplit | null => {
  const { protein, carbs, fat } = nutrients;
  if (protein === null || carbs === null || fat === null) return null;

  const proteinKcal = protein * KCAL_PER_GRAM.protein;
  const carbsKcal = carbs * KCAL_PER_GRAM.carbs;
  const fatKcal = fat * KCAL_PER_GRAM.fat;
  const total = proteinKcal + carbsKcal + fatKcal;
  if (total <= 0) return null;

  return {
    protein: (proteinKcal / total) * 100,
    carbs: (carbsKcal / total) * 100,
    fat: (fatKcal / total) * 100,
  };
};
