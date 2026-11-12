import type { FoodUnit, Visibility } from "@/generated/prisma/enums";
import type { FoodNutrition, NutrientTotals } from "@/lib/nutrition/types";

/** What the meal builder needs to know about a food (nutrients are per 100 g/ml). */
export type MealFood = FoodNutrition & {
  id: string;
  name: string;
  brands: string[];
  imageUrl: string | null;
  unit: FoodUnit;
};

export type MealSummary = {
  id: string;
  name: string;
  visibility: Visibility;
  itemCount: number;
  totals: NutrientTotals;
};

export type PublicMealSummary = MealSummary & { ownerName: string };

export type PublicMealsPage = {
  items: PublicMealSummary[];
  page: number;
  hasMore: boolean;
};

export type MealDetailItem = { id: string; amount: number; food: MealFood };

export type MealDetail = {
  id: string;
  name: string;
  notes: string | null;
  visibility: Visibility;
  isOwner: boolean;
  ownerName: string;
  /** Ordered by position. */
  items: MealDetailItem[];
};

/** GET /api/meals: the user's meals for pickers. */
export type MealOption = { id: string; name: string; itemCount: number };
