import "server-only";

import { db } from "@/lib/db";
import { barcodeVariants } from "@/lib/food/barcode";
import { toFoodData } from "@/lib/food/custom-food";

import type { CustomFoodInput } from "@/lib/food/custom-food";

export type CreateCustomFoodResult =
  | { ok: true; id: string; barcodeDropped: boolean }
  | { ok: false; error: "barcode_exists"; existingId: string };

/**
 * Creates a food visible only to the user. Barcodes are unique across all foods:
 * if the user can already see a food with this barcode they're sent to it instead;
 * if another user's private food holds it, the new food is saved without the barcode.
 */
export const createCustomFood = async (
  userId: string,
  input: CustomFoodInput,
): Promise<CreateCustomFoodResult> => {
  let barcode = input.barcode;

  if (barcode) {
    const existing = await db.food.findMany({
      where: { barcode: { in: barcodeVariants(barcode) } },
      select: { id: true, createdById: true },
    });
    const visible = existing.find(
      (food) => food.createdById === null || food.createdById === userId,
    );
    if (visible) return { ok: false, error: "barcode_exists", existingId: visible.id };
    if (existing.length > 0) barcode = null;
  }

  const food = await db.food.create({
    data: { ...toFoodData(input), barcode, source: "USER", createdById: userId },
    select: { id: true },
  });
  return { ok: true, id: food.id, barcodeDropped: Boolean(input.barcode) && !barcode };
};
