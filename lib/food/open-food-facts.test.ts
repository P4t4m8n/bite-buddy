import { describe, expect, it, vi } from "vitest";

import { hasHebrew } from "@/lib/food/hebrew";
import { normalizeSeedFood } from "@/lib/food/normalize-seed";
import {
  fetchOffProduct,
  offProductToRawSeedFood,
  offProductUrl,
  OFF_USER_AGENT,
} from "@/lib/food/open-food-facts";

import type { OffProduct } from "@/lib/food/open-food-facts";

const cottage: OffProduct = {
  code: "7290004127329",
  product_name: "Cottage cheese 5%",
  product_name_he: "קוטג' 5%",
  brands: "תנובה, Tnuva ,",
  categories_tags: ["en:dairies", "en:fermented-milk-products", "en:cottage-cheeses"],
  quantity: "250 g",
  nutriments: {
    "energy-kcal_100g": 95,
    "energy-kj_100g": 397.5,
    proteins_100g: 11,
    carbohydrates_100g: 1.5,
    sugars_100g: 1.5,
    fat_100g: 5,
    "saturated-fat_100g": 3.25,
    salt_100g: 0.875,
    sodium_100g: 0.35,
  },
  nutriscore_grade: "c",
  nova_group: 3,
  allergens_tags: ["en:milk", "en:חלב"],
  image_front_url:
    "https://images.openfoodfacts.org/images/products/729/000/412/7329/front_en.30.400.jpg",
};

describe("offProductToRawSeedFood", () => {
  it("maps a complete product so the seed normalizer can use it", () => {
    const food = normalizeSeedFood(offProductToRawSeedFood("7290004127329", cottage));
    expect(food).toMatchObject({
      barcode: "7290004127329",
      name: "קוטג' 5%",
      brands: ["תנובה", "Tnuva"],
      categories: ["dairies", "fermented milk products", "cottage cheeses"],
      imageUrl: cottage.image_front_url,
      unit: "G",
      packageAmount: 250,
      kcal100: 95,
      protein100: 11,
      carbs100: 1.5,
      fat100: 5,
      sugar100: 1.5,
      fiber100: null,
      satFat100: 3.25,
      salt100: 0.875,
      sodium100: 0.35,
      hasNutrition: true,
      nutritionGrade: "c",
      novaGroup: 3,
      allergens: ["milk", "חלב"],
    });
    expect(hasHebrew(food.name)).toBe(true);
  });

  it("falls back to the default name and the scanned code", () => {
    const raw = offProductToRawSeedFood("5449000000996", {
      product_name: " Coca-Cola ",
      product_name_he: "  ",
    });
    expect(raw.name).toBe("Coca-Cola");
    expect(raw.barcode).toBe("5449000000996");
    expect(raw.brand).toEqual([]);
    expect(raw.images).toEqual([]);
  });

  it("derives kcal from kJ and reads numeric strings", () => {
    const food = normalizeSeedFood(
      offProductToRawSeedFood("12345678", {
        product_name_he: "מיץ",
        quantity: "1 l",
        nutriments: { energy_100g: "184.1", proteins_100g: "0", fat_100g: 0, sugars_100g: "x" },
        nova_group: "4",
        nutriscore_grade: "unknown",
      }),
    );
    expect(food).toMatchObject({
      kcal100: 44,
      protein100: 0,
      fat100: 0,
      carbs100: null,
      sugar100: null,
      unit: "ML",
      packageAmount: 1000,
      hasNutrition: false,
      novaGroup: 4,
      nutritionGrade: null,
    });
  });

  it("handles a product with no data at all", () => {
    const food = normalizeSeedFood(offProductToRawSeedFood("12345678", { code: "12345678" }));
    expect(food).toMatchObject({ name: "", brands: [], hasNutrition: false, imageUrl: null });
  });
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("fetchOffProduct", () => {
  it("requests only the needed fields with a descriptive User-Agent", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ status: 1, product: cottage }));
    const result = await fetchOffProduct("7290004127329", fetchFn);

    expect(result).toEqual({ kind: "found", product: cottage });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(offProductUrl("7290004127329"));
    expect(url).toContain("fields=code,product_name,product_name_he,");
    expect(new Headers(init.headers).get("User-Agent")).toBe(OFF_USER_AGENT);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("treats a 404 or status 0 as missing", async () => {
    const notFound = { status: 0, status_verbose: "product not found" };
    expect(await fetchOffProduct("1", async () => jsonResponse(notFound, 404))).toEqual({
      kind: "missing",
    });
    expect(await fetchOffProduct("1", async () => jsonResponse(notFound))).toEqual({
      kind: "missing",
    });
  });

  it("turns network errors, server errors and bad JSON into an error result", async () => {
    const failing = async () => {
      throw new TypeError("fetch failed");
    };
    expect(await fetchOffProduct("1", failing)).toEqual({ kind: "error" });
    expect(await fetchOffProduct("1", async () => jsonResponse({}, 503))).toEqual({
      kind: "error",
    });
    expect(await fetchOffProduct("1", async () => new Response("<html>"))).toEqual({
      kind: "error",
    });
  });
});
