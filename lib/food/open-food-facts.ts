import type { RawSeedFood } from "@/lib/food/normalize-seed";

// Open Food Facts asks API clients to identify themselves with an app name, version and contact.
export const OFF_USER_AGENT = "BiteBuddy/1.0 (+https://github.com/P4t4m8n/bite-buddy)";
const OFF_TIMEOUT_MS = 8000;

// Only the fields we map; `nutriments` can't be narrowed further in the v2 API.
export const OFF_FIELDS = [
  "code",
  "product_name",
  "product_name_he",
  "brands",
  "categories_tags",
  "quantity",
  "nutriments",
  "nutriscore_grade",
  "nova_group",
  "allergens_tags",
  "image_front_url",
] as const;

type OffValue = number | string | undefined;

/** The subset of an Open Food Facts v2 product we request (see OFF_FIELDS). */
export type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_he?: string;
  brands?: string;
  categories_tags?: string[];
  quantity?: string;
  nutriments?: Record<string, OffValue>;
  nutriscore_grade?: string;
  nova_group?: number | string;
  allergens_tags?: string[];
  image_front_url?: string;
};

export type OffFetchResult =
  { kind: "found"; product: OffProduct } | { kind: "missing" } | { kind: "error" };

export const offProductUrl = (code: string): string =>
  `https://world.openfoodfacts.org/api/v2/product/${code}?fields=${OFF_FIELDS.join(",")}`;

/**
 * Fetches a product from Open Food Facts. Network errors, timeouts and unexpected
 * responses become `{ kind: "error" }` so callers never throw.
 */
export const fetchOffProduct = async (
  code: string,
  fetchFn: typeof fetch = fetch,
): Promise<OffFetchResult> => {
  try {
    const response = await fetchFn(offProductUrl(code), {
      headers: { "User-Agent": OFF_USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(OFF_TIMEOUT_MS),
    });
    // A missing product is a 404 with `{ status: 0, status_verbose: "product not found" }`.
    if (response.status === 404) return { kind: "missing" };
    if (!response.ok) return { kind: "error" };
    const body = (await response.json()) as { status?: number; product?: OffProduct };
    if (body.status !== 1 || !body.product) return { kind: "missing" };
    return { kind: "found", product: body.product };
  } catch {
    return { kind: "error" };
  }
};

const text = (value: string | undefined): string => value?.trim() ?? "";

const num = (value: OffValue): number | undefined => {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
};

// "en:fermented-milk-products" → "fermented milk products"; "en:חלב" → "חלב".
const tagName = (tag: string): string => tag.replace(/^[a-z]{2,3}:/, "").replace(/-/g, " ");

const tagNames = (tags: string[] | undefined) =>
  (tags ?? []).map((tag) => ({ name: tagName(tag) }));

/** Maps an Open Food Facts v2 product to the seed shape, so `normalizeSeedFood` can clean it. */
export const offProductToRawSeedFood = (code: string, product: OffProduct): RawSeedFood => {
  const n = product.nutriments ?? {};
  return {
    barcode: text(product.code) || code,
    // Prefer the Hebrew name: shared foods need one.
    name: text(product.product_name_he) || text(product.product_name),
    brand: (product.brands ?? "")
      .split(",")
      .map((name) => ({ name }))
      .filter(({ name }) => name.trim()),
    categories: tagNames(product.categories_tags),
    nutritionGrade: product.nutriscore_grade,
    images: product.image_front_url ? [product.image_front_url] : [],
    quantity: product.quantity,
    calories: num(n["energy-kcal_100g"]),
    energyKj: num(n["energy-kj_100g"]) ?? num(n["energy_100g"]),
    proteins: num(n["proteins_100g"]),
    carbohydrates: num(n["carbohydrates_100g"]),
    sugars: num(n["sugars_100g"]),
    fat: num(n["fat_100g"]),
    saturatedFat: num(n["saturated-fat_100g"]),
    fiber: num(n["fiber_100g"]),
    salt: num(n["salt_100g"]),
    sodium: num(n["sodium_100g"]),
    novaGroup: num(product.nova_group),
    allergens: tagNames(product.allergens_tags),
  };
};
