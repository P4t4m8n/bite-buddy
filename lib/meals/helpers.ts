import { z } from "zod";

import { MEAL_NAME_MAX } from "@/lib/meals/schemas";

const COPY_SUFFIX = " (עותק)";
const MAX_PAGE = 100;

const pageSchema = z.coerce.number().int().min(1).max(MAX_PAGE).catch(1);

/** `?page=` from the URL; anything invalid is page 1. */
export const parsePageParam = (value: string | string[] | undefined): number =>
  pageSchema.parse(Array.isArray(value) ? value[0] : (value ?? 1));

/** Name for a saved copy of a meal, shortened so it still fits MEAL_NAME_MAX. */
export const copyMealName = (name: string): string => {
  const base = name
    .trim()
    .slice(0, MEAL_NAME_MAX - COPY_SUFFIX.length)
    .trimEnd();
  return `${base}${COPY_SUFFIX}`;
};

/** Gives items their `position` (0, 1, 2, ...) in list order. */
export const withPositions = <T>(items: T[]): (T & { position: number })[] =>
  items.map((item, position) => ({ ...item, position }));

/**
 * Moves the item at `index` by `offset` places (-1 = up, 1 = down) and returns a new array.
 * Moves past either end leave the list unchanged.
 */
export const moveItem = <T>(items: T[], index: number, offset: number): T[] => {
  const target = index + offset;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
};

export const itemCountLabel = (count: number): string => {
  if (count === 0) return "ללא מוצרים";
  if (count === 1) return "מוצר אחד";
  return `${count} מוצרים`;
};
