import "server-only";
import type { FoodUnit } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { escapeLike, MIN_QUERY_LENGTH, SEARCH_PAGE_SIZE } from "@/lib/food/search-params";

export type FoodSearchResult = {
  id: string;
  name: string;
  brands: string[];
  imageUrl: string | null;
  unit: FoodUnit;
  kcal100: number;
  protein100: number;
  carbs100: number;
  fat100: number;
};

export type FoodSearchPage = {
  items: FoodSearchResult[];
  page: number;
  hasMore: boolean;
};

type SearchFoodsInput = { query: string; page: number; userId: string };

/**
 * Fuzzy search on food name (pg_trgm, uses Food_name_trgm_idx) and brand.
 * Shared foods are visible to everyone; custom foods only to their creator.
 * Ranking: name starts with the query, then closest word match, then overall similarity.
 */
export const searchFoods = async ({
  query,
  page,
  userId,
}: SearchFoodsInput): Promise<FoodSearchPage> => {
  const q = query.trim();
  if (q.length < MIN_QUERY_LENGTH) return { items: [], page, hasMore: false };

  const contains = `%${escapeLike(q)}%`;
  const startsWith = `${escapeLike(q.toLowerCase())}%`;
  const offset = (page - 1) * SEARCH_PAGE_SIZE;

  // One extra row tells us whether there is a next page.
  const rows = await db.$queryRaw<FoodSearchResult[]>`
    SELECT id, name, brands, "imageUrl", unit, "kcal100", "protein100", "carbs100", "fat100"
    FROM "Food"
    WHERE "hasNutrition"
      AND ("createdById" IS NULL OR "createdById" = ${userId})
      AND (
        ${q} <% name
        OR name ILIKE ${contains}
        OR array_to_string(brands, ' ') ILIKE ${contains}
      )
    ORDER BY
      lower(name) LIKE ${startsWith} DESC,
      word_similarity(${q}, name) DESC,
      similarity(name, ${q}) DESC,
      name
    LIMIT ${SEARCH_PAGE_SIZE + 1} OFFSET ${offset}
  `;

  return {
    items: rows.slice(0, SEARCH_PAGE_SIZE),
    page,
    hasMore: rows.length > SEARCH_PAGE_SIZE,
  };
};

/** A food the user may see: shared, or their own custom food. */
export const getVisibleFood = (id: string, userId: string) =>
  db.food.findFirst({
    where: { id, OR: [{ createdById: null }, { createdById: userId }] },
  });
