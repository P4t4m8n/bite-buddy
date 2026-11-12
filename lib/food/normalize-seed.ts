import type { Prisma } from "@/generated/prisma/client";

type Named = { name: string };

/** Shape of one item in seed/foodItems.json (Open Food Facts export). Nutrients are per 100 g/ml. */
export type RawSeedFood = {
  barcode: string;
  name: string;
  brand?: Named[];
  categories?: Named[];
  nutritionGrade?: string;
  images?: string[];
  quantity?: string;
  calories?: number;
  energyKj?: number;
  proteins?: number;
  carbohydrates?: number;
  sugars?: number;
  fat?: number;
  saturatedFat?: number;
  fiber?: number;
  salt?: number;
  sodium?: number;
  novaGroup?: number;
  allergens?: Named[];
};

export type FoodUnit = "G" | "ML";

const KJ_PER_KCAL = 4.184;
// Pure fat is ~900 kcal/100 g, so anything above this is a data error.
const MAX_KCAL_PER_100 = 900;
const MAX_GRAMS_PER_100 = 100;

const HTML_ENTITIES: Record<string, string> = {
  "&quot;": '"',
  "&amp;": "&",
  "&apos;": "'",
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(?:quot|amp|apos|#39|lt|gt);/g, (e) => HTML_ENTITIES[e]);
}

function cleanText(text: string): string {
  return decodeEntities(text).replace(/\s+/g, " ").trim();
}

function names(list: Named[] | undefined): string[] {
  const seen = new Set<string>();
  for (const item of list ?? []) {
    const name = cleanText(item.name ?? "");
    if (name) seen.add(name);
  }
  return [...seen];
}

// ─── Quantity ────────────────────────────────────────────────────────────────

// Matched against lower-cased text. Order matters: longer units first.
const UNIT_FACTORS: { pattern: string; unit: FoodUnit; factor: number }[] = [
  { pattern: "fl\\.? ?oz", unit: "ML", factor: 29.5735 },
  { pattern: 'kg|ק"ג|קג', unit: "G", factor: 1000 },
  { pattern: "mg", unit: "G", factor: 0.001 },
  { pattern: 'ml|מ"ל|מ״ל|מל|মিলি', unit: "ML", factor: 1 },
  { pattern: "cl", unit: "ML", factor: 10 },
  { pattern: "liters?|litres?|ליטר|l|ל", unit: "ML", factor: 1000 },
  { pattern: "grammes?|grams?|gram|gr|gm|g|גרם|ג'|ג|г|গ্রাম", unit: "G", factor: 1 },
  { pattern: "lbs?", unit: "G", factor: 453.592 },
  { pattern: "oz", unit: "G", factor: 28.3495 },
];

const NUM = "(\\d+(?:\\.\\d+)?|\\.\\d+)";
// A unit must not be followed by another letter (JS \b doesn't work for Hebrew).
const UNIT_END = "(?![a-zа-яא-ת])";
// Larger values are data errors (for example "212 oz" of potted seafood).
const MAX_PACKAGE_AMOUNT = 50_000;
const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";

export type ParsedQuantity = { amount: number; unit: FoodUnit };

/**
 * Parses a package quantity like "5.5 oz (158 g)", "6 x 30 g", "1,5 l" or "500 גרם".
 * Metric matches win over imperial ones, and a multipack ("6 x 30 g") returns the total.
 */
export function parseQuantity(raw: string | undefined): ParsedQuantity | null {
  if (!raw) return null;
  const text = decodeEntities(raw)
    .toLowerCase()
    .replace(/[০-৯]/g, (d) => String(BENGALI_DIGITS.indexOf(d)))
    .replace(/(?<!\d)0,(\d+)/g, "0.$1") // "0,514 kg"
    .replace(/(\d),(\d{1,2})(?!\d)/g, "$1.$2") // decimal comma
    .replace(/(\d),(\d{3})/g, "$1$2"); // thousands separator

  let best: (ParsedQuantity & { metric: boolean }) | null = null;

  for (const { pattern, unit, factor } of UNIT_FACTORS) {
    const re = new RegExp(`(?:${NUM}\\s*[x*×]\\s*)?${NUM}\\s*(?:${pattern})${UNIT_END}`, "g");
    for (const match of text.matchAll(re)) {
      const count = match[1] ? Number(match[1]) : 1;
      const amount = Math.round(count * Number(match[2]) * factor * 10) / 10;
      if (!(amount > 0) || amount > MAX_PACKAGE_AMOUNT) continue;
      const metric = !/oz|lb/.test(pattern);
      if (!best || (metric && !best.metric)) best = { amount, unit, metric };
    }
    if (best?.metric) break;
  }

  return best ? { amount: best.amount, unit: best.unit } : null;
}

// ─── Unit ────────────────────────────────────────────────────────────────────

// Exact category names that mean the product is a liquid. Broad names like
// "plant based foods and beverages" or dry ones like "instant coffees" are excluded on purpose.
const DRINK_CATEGORIES = new Set([
  "beverages",
  "plant based beverages",
  "alcoholic beverages",
  "carbonated drinks",
  "sodas",
  "beers",
  "wines",
  "fruit based beverages",
  "juices and nectars",
  "fruit juices",
  "waters",
  "spring waters",
  "mineral waters",
  "milks",
  "milk substitutes",
  "plant based milk alternatives",
  "dairy drinks",
  "tea based beverages",
  "artificially sweetened beverages",
  "sweetened beverages",
]);

const DRY_CATEGORY = /instant|powder|preparation|coffees|teas|beans/;

export function detectUnit(quantity: ParsedQuantity | null, categories: string[]): FoodUnit {
  if (quantity) return quantity.unit;
  const lower = categories.map((c) => c.toLowerCase());
  if (lower.some((c) => DRY_CATEGORY.test(c))) return "G";
  return lower.some((c) => DRINK_CATEGORIES.has(c)) ? "ML" : "G";
}

// ─── Images ──────────────────────────────────────────────────────────────────

export function pickImage(images: string[] | undefined): string | null {
  if (!images?.length) return null;
  return (
    images.find((u) => /\/front_[a-z]+\.\d+\.400\.jpg$/.test(u)) ??
    images.find((u) => /\.400\.jpg$/.test(u)) ??
    null
  );
}

// ─── Nutrients ───────────────────────────────────────────────────────────────

function nutrient(value: number | undefined, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) return null;
  return value;
}

function kcal(item: RawSeedFood): number | null {
  const direct = nutrient(item.calories, MAX_KCAL_PER_100);
  if (direct !== null) return direct;
  if (typeof item.energyKj !== "number") return null;
  return nutrient(Math.round((item.energyKj / KJ_PER_KCAL) * 10) / 10, MAX_KCAL_PER_100);
}

const NUTRITION_GRADES = new Set(["a", "b", "c", "d", "e"]);
// Salt is sodium chloride: 1 g sodium ≈ 2.5 g salt.
const SALT_PER_SODIUM = 2.5;

// ─── Normalize ───────────────────────────────────────────────────────────────

export function normalizeSeedFood(item: RawSeedFood): Prisma.FoodCreateManyInput {
  const categories = names(item.categories);
  const quantity = parseQuantity(item.quantity);

  const kcal100 = kcal(item);
  const protein100 = nutrient(item.proteins, MAX_GRAMS_PER_100);
  const carbs100 = nutrient(item.carbohydrates, MAX_GRAMS_PER_100);
  const fat100 = nutrient(item.fat, MAX_GRAMS_PER_100);
  const salt100 = nutrient(item.salt, MAX_GRAMS_PER_100);
  const sodium100 =
    nutrient(item.sodium, MAX_GRAMS_PER_100) ??
    (salt100 === null ? null : salt100 / SALT_PER_SODIUM);
  const grade = item.nutritionGrade?.toLowerCase();

  return {
    barcode: item.barcode.trim(),
    name: cleanText(item.name),
    brands: names(item.brand),
    categories,
    imageUrl: pickImage(item.images),
    unit: detectUnit(quantity, categories),
    packageAmount: quantity?.amount ?? null,
    kcal100,
    protein100,
    carbs100,
    fat100,
    sugar100: nutrient(item.sugars, MAX_GRAMS_PER_100),
    fiber100: nutrient(item.fiber, MAX_GRAMS_PER_100),
    satFat100: nutrient(item.saturatedFat, MAX_GRAMS_PER_100),
    salt100,
    sodium100,
    hasNutrition: [kcal100, protein100, carbs100, fat100].every((v) => v !== null),
    nutritionGrade: grade && NUTRITION_GRADES.has(grade) ? grade : null,
    novaGroup: typeof item.novaGroup === "number" ? item.novaGroup : null,
    allergens: names(item.allergens),
    source: "SEED",
  };
}
