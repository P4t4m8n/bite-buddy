import { z } from "zod";

import type { FoodUnit } from "@/generated/prisma/enums";

export const BARCODE_ERROR = "ברקוד צריך להכיל 8–14 ספרות.";

/** EAN-8, UPC-E (8 digits), UPC-A (12), EAN-13 and GTIN-14. */
export const barcodeSchema = z
  .string()
  .trim()
  .regex(/^\d{8,14}$/, BARCODE_ERROR);

export const parseBarcode = (value: unknown): string | null => {
  const result = barcodeSchema.safeParse(value);
  return result.success ? result.data : null;
};

/**
 * The same product can be stored as UPC-A (12 digits) or as EAN-13 with a leading 0,
 * so a lookup checks both forms.
 */
export const barcodeVariants = (code: string): string[] => {
  if (code.length === 12) return [code, `0${code}`];
  if (code.length === 13 && code.startsWith("0")) return [code, code.slice(1)];
  return [code];
};

export type BarcodeFood = {
  id: string;
  name: string;
  brands: string[];
  imageUrl: string | null;
  unit: FoodUnit;
  kcal100: number | null;
  protein100: number | null;
  carbs100: number | null;
  fat100: number | null;
};

/** Whatever is known about a product that can't be saved as a shared food yet. */
export type FoodPrefill = {
  barcode: string;
  name: string | null;
  brands: string[];
  unit: FoodUnit;
  packageAmount: number | null;
  kcal100: number | null;
  protein100: number | null;
  carbs100: number | null;
  fat100: number | null;
  sugar100: number | null;
  fiber100: number | null;
  satFat100: number | null;
  sodium100: number | null;
};

/** JSON body of GET /api/foods/barcode/[code]. */
export type BarcodeLookupResult =
  | { status: "found"; food: BarcodeFood }
  | { status: "incomplete"; prefill: FoodPrefill }
  | { status: "not_found"; barcode: string; offUnavailable?: boolean };

const PREFILL_NUMBERS = [
  "packageAmount",
  "kcal100",
  "protein100",
  "carbs100",
  "fat100",
  "sugar100",
  "fiber100",
  "satFat100",
  "sodium100",
] as const;

/** Link to the custom food form (Step 8), prefilled with what the lookup found. */
export const createFoodHref = (barcode: string, prefill?: FoodPrefill): string => {
  const params = new URLSearchParams({ barcode });
  if (prefill) {
    if (prefill.name) params.set("name", prefill.name);
    if (prefill.brands.length > 0) params.set("brands", prefill.brands.join(", "));
    params.set("unit", prefill.unit);
    for (const key of PREFILL_NUMBERS) {
      const value = prefill[key];
      if (value !== null) params.set(key, String(value));
    }
  }
  return `/foods/new?${params}`;
};
