import { describe, expect, it } from "vitest";
import { formatNutrient, roundNutrient } from "@/lib/nutrition/format";

describe("roundNutrient", () => {
  it("rounds kcal to whole numbers", () => {
    expect(roundNutrient("kcal", 188.16)).toBe(188);
    expect(roundNutrient("kcal", 2.4)).toBe(2);
  });

  it("keeps one decimal for grams below 10", () => {
    expect(roundNutrient("protein", 8.45)).toBe(8.5);
    expect(roundNutrient("fat", 0.04)).toBe(0);
  });

  it("rounds grams of 10 or more to whole numbers", () => {
    expect(roundNutrient("carbs", 66.3)).toBe(66);
  });
});

describe("formatNutrient", () => {
  it("adds Hebrew units and shows unknown values as a dash", () => {
    expect(formatNutrient("kcal", 535.4)).toBe("535 קק״ל");
    expect(formatNutrient("protein", 3.57)).toBe("3.6 ג׳");
    expect(formatNutrient("sugar", null)).toBe("–");
  });

  it("shows sodium in milligrams", () => {
    expect(formatNutrient("sodium", 0.5714)).toBe("571 מ״ג");
  });
});
