import { MEAL_TYPES } from "@/lib/diary/schemas";

import type { MealType } from "@/generated/prisma/enums";
import type { DateKey } from "@/lib/diary/dates";

/** The "add to breakfast/lunch/..." page for one diary day. */
export const addToDiaryHref = (date: DateKey, mealType: MealType): string =>
  `/diary/add?${new URLSearchParams({ date, meal: mealType })}`;

export const diaryDayHref = (date: DateKey): string => `/?${new URLSearchParams({ date })}`;

/** `?meal=` from the URL; null when it isn't a meal type. */
export const parseMealTypeParam = (value: string | string[] | undefined): MealType | null => {
  const raw = Array.isArray(value) ? value[0] : value;
  return MEAL_TYPES.find((type) => type === raw) ?? null;
};
