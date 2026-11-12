import { z } from "zod";

export const SEARCH_PAGE_SIZE = 20;
export const MIN_QUERY_LENGTH = 2;
const MAX_PAGE = 50;

type RawParam = string | string[] | undefined | null;

const first = (value: RawParam) => (Array.isArray(value) ? value[0] : (value ?? undefined));

// Invalid values fall back to defaults instead of failing: these come straight from the URL.
const foodSearchSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).max(MAX_PAGE).catch(1),
});

export type FoodSearchParams = z.infer<typeof foodSearchSchema>;

export const parseFoodSearchParams = (params: {
  q?: RawParam;
  page?: RawParam;
}): FoodSearchParams =>
  foodSearchSchema.parse({ q: first(params.q) ?? "", page: first(params.page) ?? 1 });

/** Escapes LIKE/ILIKE wildcards so user input is matched literally. */
export const escapeLike = (text: string): string => text.replace(/[\\%_]/g, "\\$&");

export const searchHref = (q: string, page = 1): string => {
  const params = new URLSearchParams({ q });
  if (page > 1) params.set("page", String(page));
  return `/search?${params}`;
};
