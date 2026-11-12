import type { NutrientKey } from "@/lib/nutrition/types";

export const UNKNOWN = "–";

/**
 * Rounds a value for display only (never store rounded values):
 * kcal to a whole number, sodium to whole milligrams,
 * other grams to 1 decimal below 10 g and whole above.
 */
export const roundNutrient = (key: NutrientKey, value: number): number => {
  if (key === "sodium") return Math.round(value * 1000) / 1000;
  if (key === "kcal" || Math.abs(value) >= 10) return Math.round(value);
  return Math.round(value * 10) / 10;
};

export const formatNutrient = (key: NutrientKey, value: number | null): string => {
  if (value === null) return UNKNOWN;
  if (key === "sodium") return `${Math.round(value * 1000)} mg`;
  const rounded = roundNutrient(key, value);
  return key === "kcal" ? `${rounded} kcal` : `${rounded} g`;
};

export const formatPercent = (value: number): string => `${Math.round(value)}%`;
