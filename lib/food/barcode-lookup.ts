import "server-only";

import { db } from "@/lib/db";
import { barcodeVariants } from "@/lib/food/barcode";
import { hasHebrew } from "@/lib/food/hebrew";
import { normalizeSeedFood } from "@/lib/food/normalize-seed";
import { fetchOffProduct, offProductToRawSeedFood } from "@/lib/food/open-food-facts";

import type { BarcodeFood, BarcodeLookupResult } from "@/lib/food/barcode";

const foodSelect = {
  id: true,
  name: true,
  brands: true,
  imageUrl: true,
  unit: true,
  kcal100: true,
  protein100: true,
  carbs100: true,
  fat100: true,
  createdById: true,
} as const;

type FoundRow = BarcodeFood & { createdById: string | null };

const isVisible = (food: FoundRow, userId: string) =>
  food.createdById === null || food.createdById === userId;

const toBarcodeFood = (row: FoundRow): BarcodeFood => ({
  id: row.id,
  name: row.name,
  brands: row.brands,
  imageUrl: row.imageUrl,
  unit: row.unit,
  kcal100: row.kcal100,
  protein100: row.protein100,
  carbs100: row.carbs100,
  fat100: row.fat100,
});

const findByBarcodes = (barcodes: string[]) =>
  db.food.findMany({ where: { barcode: { in: barcodes } }, select: foodSelect });

/**
 * Finds a food by barcode: first in the database (shared foods and the user's own),
 * then on Open Food Facts. An OFF product with full macros and a Hebrew name is saved
 * as a shared food (`source = OFF`); anything less is returned as a prefill for a custom food.
 */
export const lookupBarcode = async (
  code: string,
  userId: string,
  fetchFn?: typeof fetch,
): Promise<BarcodeLookupResult> => {
  const existing = await findByBarcodes(barcodeVariants(code));
  const visible = existing.find((food) => isVisible(food, userId));
  if (visible) return { status: "found", food: toBarcodeFood(visible) };

  const off = await fetchOffProduct(code, fetchFn);
  if (off.kind === "error") return { status: "not_found", barcode: code, offUnavailable: true };
  if (off.kind === "missing") return { status: "not_found", barcode: code };

  const food = normalizeSeedFood(offProductToRawSeedFood(code, off.product));

  // Another user's custom food may already hold this barcode (it is unique), so it can't be saved.
  const barcodeTaken = existing.some((row) => !isVisible(row, userId));
  if (food.hasNutrition && hasHebrew(food.name) && !barcodeTaken) {
    // ON CONFLICT DO NOTHING: a parallel request may have inserted the same barcode first.
    await db.food.createMany({ data: [{ ...food, source: "OFF" }], skipDuplicates: true });
    const saved = await db.food.findUnique({
      where: { barcode: food.barcode ?? code },
      select: foodSelect,
    });
    if (saved && isVisible(saved, userId)) return { status: "found", food: toBarcodeFood(saved) };
  }

  return {
    status: "incomplete",
    prefill: {
      barcode: code,
      name: food.name || null,
      brands: food.brands as string[],
      unit: food.unit ?? "G",
      packageAmount: food.packageAmount ?? null,
      kcal100: food.kcal100 ?? null,
      protein100: food.protein100 ?? null,
      carbs100: food.carbs100 ?? null,
      fat100: food.fat100 ?? null,
      sugar100: food.sugar100 ?? null,
      fiber100: food.fiber100 ?? null,
      satFat100: food.satFat100 ?? null,
      sodium100: food.sodium100 ?? null,
    },
  };
};
