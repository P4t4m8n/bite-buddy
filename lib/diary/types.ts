import type { FoodUnit, MealType } from "@/generated/prisma/enums";
import type { DateKey } from "@/lib/diary/dates";
import type { UserGoals } from "@/lib/user/settings";
import type { NutrientTotals, Nutrients } from "@/lib/nutrition/types";

export type DiaryEntry = {
  id: string;
  name: string;
  mealType: MealType;
  foodId: string | null;
  mealId: string | null;
  /** Set for a logged food, with the food's unit (G when the food was deleted). */
  amount: number | null;
  unit: FoodUnit;
  /** Set for a logged meal. */
  servings: number | null;
  nutrients: Nutrients;
};

export type DiarySection = {
  mealType: MealType;
  entries: DiaryEntry[];
  totals: NutrientTotals;
};

export type DiaryDay = {
  date: DateKey;
  today: DateKey;
  timezone: string;
  sections: DiarySection[];
  totals: NutrientTotals;
  goals: UserGoals | null;
};
