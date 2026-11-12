import { describe, expect, it } from "vitest";
import {
  foodPer100,
  macroSplit,
  mealNutrition,
  multiply,
  scale,
  sumNutrients,
} from "@/lib/nutrition/nutrients";
import type { FoodNutrition, Nutrients } from "@/lib/nutrition/types";

// Real seed values per 100 g.
const peanutButter: FoodNutrition = {
  kcal100: 588,
  protein100: 25,
  carbs100: 20,
  fat100: 50,
  fiber100: 6,
  sugar100: 9,
  satFat100: 10,
  sodium100: 0.4,
};
const oats: FoodNutrition = {
  kcal100: 389,
  protein100: 16.9,
  carbs100: 66.3,
  fat100: 6.9,
  fiber100: 10.6,
  sugar100: null,
  satFat100: 1.2,
  sodium100: null,
};

const nutrients = (values: Partial<Nutrients>): Nutrients => ({
  kcal: null,
  protein: null,
  carbs: null,
  fat: null,
  fiber: null,
  sugar: null,
  satFat: null,
  sodium: null,
  ...values,
});

describe("scale", () => {
  it("scales per-100 values to the amount", () => {
    expect(scale(foodPer100(peanutButter), 32)).toEqual({
      kcal: 188.16,
      protein: 8,
      carbs: 6.4,
      fat: 16,
      fiber: 1.92,
      sugar: 2.88,
      satFat: 3.2,
      sodium: 0.128,
    });
  });

  it("keeps unknown values unknown, also at 0 g", () => {
    const zero = scale(foodPer100(oats), 0);
    expect(zero.kcal).toBe(0);
    expect(zero.sugar).toBeNull();
  });

  it("rejects negative or non-finite amounts", () => {
    expect(() => scale(foodPer100(oats), -1)).toThrow(RangeError);
    expect(() => scale(foodPer100(oats), Number.NaN)).toThrow(RangeError);
  });
});

describe("multiply", () => {
  it("scales a meal by servings", () => {
    expect(multiply(nutrients({ kcal: 500, sugar: null }), 1.5)).toMatchObject({
      kcal: 750,
      sugar: null,
    });
  });
});

describe("sumNutrients", () => {
  it("adds known values and flags nutrients some items lack", () => {
    const totals = sumNutrients([
      nutrients({ kcal: 100, sugar: 5 }),
      nutrients({ kcal: 50, sugar: null }),
    ]);
    expect(totals.values.kcal).toBe(150);
    expect(totals.values.sugar).toBe(5);
    expect(totals.incomplete).toContain("sugar");
    expect(totals.incomplete).not.toContain("kcal");
  });

  it("is null when no item has the nutrient", () => {
    expect(sumNutrients([nutrients({}), nutrients({})]).values.fiber).toBeNull();
  });

  it("is 0 and complete for an empty list", () => {
    const totals = sumNutrients([]);
    expect(totals.values.kcal).toBe(0);
    expect(totals.incomplete).toEqual([]);
  });
});

describe("mealNutrition", () => {
  it("returns per-item nutrients, totals and total amount", () => {
    const meal = mealNutrition([
      { food: oats, amount: 50 },
      { food: peanutButter, amount: 20 },
    ]);

    expect(meal.items).toHaveLength(2);
    expect(meal.items[0].kcal).toBeCloseTo(194.5);
    expect(meal.totals.values.kcal).toBeCloseTo(194.5 + 117.6);
    expect(meal.totals.values.protein).toBeCloseTo(8.45 + 5);
    expect(meal.totals.incomplete).toEqual(["sugar", "sodium"]);
    expect(meal.totalAmount).toBe(70);
  });
});

describe("macroSplit", () => {
  it("splits calories from macros using 4/4/9 kcal per gram", () => {
    const split = macroSplit(nutrients({ protein: 25, carbs: 25, fat: 100 / 9 }));
    expect(split?.protein).toBeCloseTo(100 / 3);
    expect(split?.carbs).toBeCloseTo(100 / 3);
    expect(split?.fat).toBeCloseTo(100 / 3);
  });

  it("adds up to 100", () => {
    const split = macroSplit(foodPer100(peanutButter))!;
    expect(split.protein + split.carbs + split.fat).toBeCloseTo(100);
  });

  it("is null when a macro is unknown or there are no macro calories", () => {
    expect(macroSplit(nutrients({ protein: 10, carbs: 10 }))).toBeNull();
    expect(macroSplit(nutrients({ protein: 0, carbs: 0, fat: 0 }))).toBeNull();
  });
});
