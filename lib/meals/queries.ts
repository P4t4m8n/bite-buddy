import "server-only";

import { db } from "@/lib/db";
import { mealNutrition } from "@/lib/nutrition/nutrients";

import type { Prisma } from "@/generated/prisma/client";
import type {
  MealDetail,
  MealFood,
  MealOption,
  MealSummary,
  PublicMealsPage,
} from "@/lib/meals/types";

export const PUBLIC_MEALS_PAGE_SIZE = 20;

export const mealFoodSelect = {
  id: true,
  name: true,
  brands: true,
  imageUrl: true,
  unit: true,
  kcal100: true,
  protein100: true,
  carbs100: true,
  fat100: true,
  fiber100: true,
  sugar100: true,
  satFat100: true,
  sodium100: true,
} satisfies Prisma.FoodSelect;

const summarySelect = {
  id: true,
  name: true,
  visibility: true,
  items: { select: { amount: true, food: { select: mealFoodSelect } } },
} satisfies Prisma.MealSelect;

type SummaryRow = Prisma.MealGetPayload<{ select: typeof summarySelect }>;

/** Case-insensitive meal-name filter; an empty query matches every meal. */
const nameFilter = (query: string): Prisma.MealWhereInput =>
  query ? { name: { contains: query, mode: "insensitive" } } : {};

const toSummary = (meal: SummaryRow): MealSummary => ({
  id: meal.id,
  name: meal.name,
  visibility: meal.visibility,
  itemCount: meal.items.length,
  totals: mealNutrition(meal.items).totals,
});

/** The user's meals, most recently edited first. */
export const listMyMeals = async (userId: string, query = ""): Promise<MealSummary[]> => {
  const meals = await db.meal.findMany({
    where: { userId, ...nameFilter(query) },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: summarySelect,
  });
  return meals.map(toSummary);
};

/** For the "add to meal" picker on the food page. */
export const listMyMealOptions = (userId: string): Promise<MealOption[]> =>
  db.meal
    .findMany({
      where: { userId },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      select: { id: true, name: true, _count: { select: { items: true } } },
    })
    .then((meals) => meals.map(({ id, name, _count }) => ({ id, name, itemCount: _count.items })));

/** Public meals of other users, newest first. */
export const listPublicMeals = async (
  userId: string,
  page: number,
  query = "",
): Promise<PublicMealsPage> => {
  // One extra row tells us whether there is a next page.
  const meals = await db.meal.findMany({
    where: { visibility: "PUBLIC", userId: { not: userId }, ...nameFilter(query) },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * PUBLIC_MEALS_PAGE_SIZE,
    take: PUBLIC_MEALS_PAGE_SIZE + 1,
    select: { ...summarySelect, user: { select: { name: true } } },
  });
  return {
    items: meals
      .slice(0, PUBLIC_MEALS_PAGE_SIZE)
      .map((meal) => ({ ...toSummary(meal), ownerName: meal.user.name })),
    page,
    hasMore: meals.length > PUBLIC_MEALS_PAGE_SIZE,
  };
};

/** A meal the user may see (their own, or a public one), with items in order. */
export const getVisibleMeal = async (id: string, userId: string): Promise<MealDetail | null> => {
  const meal = await db.meal.findFirst({
    where: { id, OR: [{ userId }, { visibility: "PUBLIC" }] },
    select: {
      id: true,
      name: true,
      notes: true,
      visibility: true,
      userId: true,
      user: { select: { name: true } },
      items: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: { id: true, amount: true, food: { select: mealFoodSelect } },
      },
    },
  });
  if (!meal) return null;

  return {
    id: meal.id,
    name: meal.name,
    notes: meal.notes,
    visibility: meal.visibility,
    isOwner: meal.userId === userId,
    ownerName: meal.user.name,
    items: meal.items.map((item) => ({
      id: item.id,
      amount: item.amount,
      food: item.food satisfies MealFood,
    })),
  };
};
