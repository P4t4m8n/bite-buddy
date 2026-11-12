import "server-only";

import { db } from "@/lib/db";
import { copyMealName, withPositions } from "@/lib/meals/helpers";
import { MEAL_ITEMS_MAX } from "@/lib/meals/schemas";

import type { CreateMealInput, MealItemInput, UpdateMealInput } from "@/lib/meals/schemas";

export type MealWriteError = "not_found" | "forbidden" | "invalid_food" | "too_many_items";
export type MealWriteResult = { ok: true; id: string } | { ok: false; error: MealWriteError };

const fail = (error: MealWriteError): MealWriteResult => ({ ok: false, error });

/**
 * Who may change a meal: only its owner. Someone else's public meal is "forbidden"
 * (they can see it); a private one is "not_found" so its existence isn't revealed.
 */
const checkOwner = async (id: string, userId: string): Promise<MealWriteError | null> => {
  const meal = await db.meal.findUnique({
    where: { id },
    select: { userId: true, visibility: true },
  });
  if (!meal) return "not_found";
  if (meal.userId === userId) return null;
  return meal.visibility === "PUBLIC" ? "forbidden" : "not_found";
};

/**
 * Whether every food is visible to the user (shared, or their own custom food).
 * `alreadyInMeal` foods are allowed too: a copied public meal may contain another
 * user's custom food, and editing the copy shouldn't fail because of it.
 */
const foodsAreUsable = async (foodIds: string[], userId: string, alreadyInMeal: string[] = []) => {
  const ids = [...new Set(foodIds)].filter((id) => !alreadyInMeal.includes(id));
  if (ids.length === 0) return true;
  const visible = await db.food.count({
    where: { id: { in: ids }, OR: [{ createdById: null }, { createdById: userId }] },
  });
  return visible === ids.length;
};

const itemRows = (items: MealItemInput[]) =>
  withPositions(items).map(({ foodId, amount, position }) => ({ foodId, amount, position }));

export const createMeal = async (
  userId: string,
  input: CreateMealInput,
): Promise<MealWriteResult> => {
  const foodIds = input.items.map((item) => item.foodId);
  if (!(await foodsAreUsable(foodIds, userId))) return fail("invalid_food");

  const meal = await db.meal.create({
    data: {
      userId,
      name: input.name,
      notes: input.notes,
      visibility: input.visibility,
      items: { create: itemRows(input.items) },
    },
    select: { id: true },
  });
  return { ok: true, id: meal.id };
};

/** Updates the given fields; `items` replaces the whole list (positions follow its order). */
export const updateMeal = async (
  id: string,
  userId: string,
  input: UpdateMealInput,
): Promise<MealWriteResult> => {
  const denied = await checkOwner(id, userId);
  if (denied) return fail(denied);

  const { items, ...fields } = input;
  if (items) {
    const current = await db.mealItem.findMany({ where: { mealId: id }, select: { foodId: true } });
    const usable = await foodsAreUsable(
      items.map((item) => item.foodId),
      userId,
      current.map((item) => item.foodId),
    );
    if (!usable) return fail("invalid_food");
  }

  // A nested write runs in one transaction: the old items are only removed if the new ones are saved.
  await db.meal.update({
    where: { id, userId },
    data: {
      ...fields,
      ...(items ? { items: { deleteMany: {}, create: itemRows(items) } } : {}),
    },
  });
  return { ok: true, id };
};

/** Items cascade; log entries keep their snapshot (their mealId is set to null). */
export const deleteMeal = async (id: string, userId: string): Promise<MealWriteResult> => {
  const denied = await checkOwner(id, userId);
  if (denied) return fail(denied);
  await db.meal.deleteMany({ where: { id, userId } });
  return { ok: true, id };
};

/** Saves a private copy of a public (or own) meal for the user. */
export const copyMeal = async (id: string, userId: string): Promise<MealWriteResult> => {
  const source = await db.meal.findFirst({
    where: { id, OR: [{ userId }, { visibility: "PUBLIC" }] },
    select: {
      name: true,
      notes: true,
      items: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: { foodId: true, amount: true },
      },
    },
  });
  if (!source) return fail("not_found");

  const copy = await db.meal.create({
    data: {
      userId,
      name: copyMealName(source.name),
      notes: source.notes,
      visibility: "PRIVATE",
      copiedFromId: id,
      items: { create: itemRows(source.items) },
    },
    select: { id: true },
  });
  return { ok: true, id: copy.id };
};

/** Adds one food at the end of the user's meal. */
export const appendMealItem = async (
  id: string,
  userId: string,
  item: MealItemInput,
): Promise<MealWriteResult> => {
  const denied = await checkOwner(id, userId);
  if (denied) return fail(denied);
  if (!(await foodsAreUsable([item.foodId], userId))) return fail("invalid_food");

  return db.$transaction(async (tx): Promise<MealWriteResult> => {
    const { _count, _max } = await tx.mealItem.aggregate({
      where: { mealId: id },
      _count: true,
      _max: { position: true },
    });
    if (_count >= MEAL_ITEMS_MAX) return fail("too_many_items");

    await tx.mealItem.create({
      data: {
        mealId: id,
        foodId: item.foodId,
        amount: item.amount,
        position: (_max.position ?? -1) + 1,
      },
    });
    // Moves the meal to the top of "my meals".
    await tx.meal.update({ where: { id }, data: { updatedAt: new Date() } });
    return { ok: true, id };
  });
};
