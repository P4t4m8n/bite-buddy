import { describe, expect, it } from "vitest";
import {
  detectUnit,
  normalizeSeedFood,
  parseQuantity,
  pickImage,
  type RawSeedFood,
} from "@/lib/food/normalize-seed";

const base: RawSeedFood = { barcode: "0038000138430", name: "Pringles Sour Cream & Onion" };

describe("parseQuantity", () => {
  it.each([
    ["158 g", { amount: 158, unit: "G" }],
    ["500g", { amount: 500, unit: "G" }],
    ["1,5 l", { amount: 1500, unit: "ML" }],
    ["33 cl", { amount: 330, unit: "ML" }],
    ["1 kg", { amount: 1000, unit: "G" }],
    ["1,000 g", { amount: 1000, unit: "G" }],
    ["6 x 30 g", { amount: 180, unit: "G" }],
    ["500 גרם", { amount: 500, unit: "G" }],
    ["250 מ&quot;ל", { amount: 250, unit: "ML" }],
    ["1.5 ליטר", { amount: 1500, unit: "ML" }],
    ["12 fl oz", { amount: 354.9, unit: "ML" }],
    ["16 oz", { amount: 453.6, unit: "G" }],
    ["0,514kg", { amount: 514, unit: "G" }],
    [".238kg", { amount: 238, unit: "G" }],
    ["৫০ গ্রাম", { amount: 50, unit: "G" }],
    ["২০০ মিলি", { amount: 200, unit: "ML" }],
  ] as const)("parses %s", (raw, expected) => {
    expect(parseQuantity(raw)).toEqual(expected);
  });

  it("prefers the metric value when both are given", () => {
    expect(parseQuantity("5.5 oz (158 g)")).toEqual({ amount: 158, unit: "G" });
  });

  it("returns null when there is no unit or amount", () => {
    expect(parseQuantity("500")).toBeNull();
    expect(parseQuantity("2 pack")).toBeNull();
    expect(parseQuantity(undefined)).toBeNull();
  });

  it("rejects impossible package sizes", () => {
    expect(parseQuantity("212 lbs")).toBeNull();
  });
});

describe("detectUnit", () => {
  it("uses the quantity unit first", () => {
    expect(detectUnit({ amount: 500, unit: "ML" }, [])).toBe("ML");
    expect(detectUnit({ amount: 200, unit: "G" }, ["beverages"])).toBe("G");
  });

  it("falls back to drink categories", () => {
    expect(detectUnit(null, ["Beverages", "sodas"])).toBe("ML");
  });

  it("does not treat broad or dry categories as drinks", () => {
    expect(detectUnit(null, ["plant based foods and beverages"])).toBe("G");
    expect(detectUnit(null, ["beverages", "instant coffees"])).toBe("G");
  });
});

describe("pickImage", () => {
  const dir = "https://images.openfoodfacts.org/images/products/003/760/020/7256";

  it("prefers the 400px front image", () => {
    const images = [`${dir}/1.400.jpg`, `${dir}/front_fr.12.200.jpg`, `${dir}/front_fr.12.400.jpg`];
    expect(pickImage(images)).toBe(`${dir}/front_fr.12.400.jpg`);
  });

  it("falls back to any 400px image, or null", () => {
    expect(pickImage([`${dir}/1.full.jpg`, `${dir}/2.400.jpg`])).toBe(`${dir}/2.400.jpg`);
    expect(pickImage([`${dir}/1.full.jpg`])).toBeNull();
    expect(pickImage(undefined)).toBeNull();
  });
});

describe("normalizeSeedFood", () => {
  it("maps a complete item", () => {
    const food = normalizeSeedFood({
      ...base,
      name: "  &quot;Froop&quot;   yogurt ",
      brand: [{ name: "Pringles" }, { name: "Pringles" }, { name: " " }],
      categories: [{ name: "snacks" }],
      quantity: "5.5 oz (158 g)",
      calories: 535,
      proteins: 3.57,
      carbohydrates: 57.1,
      fat: 32.1,
      nutritionGrade: "E",
      novaGroup: 4,
      allergens: [{ name: "milk" }],
    });

    expect(food).toMatchObject({
      barcode: "0038000138430",
      name: '"Froop" yogurt',
      brands: ["Pringles"],
      unit: "G",
      packageAmount: 158,
      kcal100: 535,
      protein100: 3.57,
      hasNutrition: true,
      nutritionGrade: "e",
      novaGroup: 4,
      allergens: ["milk"],
      source: "SEED",
    });
  });

  it("keeps missing nutrients as null and marks the item incomplete", () => {
    const food = normalizeSeedFood({ ...base, calories: 100, proteins: 2 });
    expect(food.carbs100).toBeNull();
    expect(food.fat100).toBeNull();
    expect(food.hasNutrition).toBe(false);
  });

  it("drops impossible values", () => {
    const food = normalizeSeedFood({
      ...base,
      calories: 1200,
      proteins: 150,
      carbohydrates: -1,
      fat: 10,
    });
    expect(food).toMatchObject({ kcal100: null, protein100: null, carbs100: null, fat100: 10 });
    expect(food.hasNutrition).toBe(false);
  });

  it("derives kcal from kJ when kcal is missing", () => {
    expect(normalizeSeedFood({ ...base, energyKj: 2240 }).kcal100).toBe(535.4);
  });

  it("derives sodium from salt when sodium is missing", () => {
    expect(normalizeSeedFood({ ...base, salt: 1.5 }).sodium100).toBeCloseTo(0.6);
    expect(normalizeSeedFood({ ...base, salt: 1.5, sodium: 0.5 }).sodium100).toBe(0.5);
  });

  it("stores only real Nutri-Score grades", () => {
    expect(normalizeSeedFood({ ...base, nutritionGrade: "unknown" }).nutritionGrade).toBeNull();
    expect(
      normalizeSeedFood({ ...base, nutritionGrade: "not-applicable" }).nutritionGrade,
    ).toBeNull();
  });
});
