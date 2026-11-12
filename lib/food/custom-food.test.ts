import { describe, expect, it } from "vitest";

import {
  customFoodSchema,
  formValuesToBody,
  prefillFromSearchParams,
  toFoodData,
} from "@/lib/food/custom-food";

const valid = {
  name: "  חומוס ביתי ",
  brands: "שלי, שלי,  ",
  barcode: "",
  unit: "G",
  packageAmount: null,
  kcal100: 250,
  protein100: 8,
  carbs100: 14,
  fat100: 18,
  sugar100: null,
  fiber100: 6,
  satFat100: 2.5,
  sodiumMg100: 400,
};

describe("customFoodSchema", () => {
  it("trims, dedupes brands and turns an empty barcode into null", () => {
    const food = customFoodSchema.parse(valid);
    expect(food).toMatchObject({ name: "חומוס ביתי", brands: ["שלי"], barcode: null });
  });

  it("requires the four macros", () => {
    expect(customFoodSchema.safeParse({ ...valid, kcal100: undefined }).success).toBe(false);
  });

  it("rejects impossible values", () => {
    expect(
      customFoodSchema.safeParse({ ...valid, protein100: 60, carbs100: 30, fat100: 20 }).success,
    ).toBe(false);
    expect(customFoodSchema.safeParse({ ...valid, sugar100: 20 }).success).toBe(false);
    expect(customFoodSchema.safeParse({ ...valid, satFat100: 19 }).success).toBe(false);
    expect(customFoodSchema.safeParse({ ...valid, kcal100: 901 }).success).toBe(false);
    expect(customFoodSchema.safeParse({ ...valid, barcode: "12" }).success).toBe(false);
  });

  it("stores sodium in grams", () => {
    expect(toFoodData(customFoodSchema.parse(valid)).sodium100).toBe(0.4);
  });
});

describe("prefillFromSearchParams", () => {
  it("reads scan prefill and converts sodium to mg", () => {
    const values = prefillFromSearchParams({
      barcode: "7290000000001",
      name: "Original Light",
      unit: "ML",
      kcal100: "535.714285714",
      sodium100: "0.571",
    });
    expect(values).toMatchObject({
      barcode: "7290000000001",
      name: "Original Light",
      unit: "ML",
      kcal100: "535.71",
      sodiumMg100: "571",
      protein100: "",
    });
  });

  it("ignores invalid values", () => {
    const values = prefillFromSearchParams({ barcode: "abc", unit: "X", kcal100: "-5" });
    expect(values).toMatchObject({ barcode: "", unit: "G", kcal100: "" });
  });
});

describe("formValuesToBody", () => {
  it("parses numbers, accepts a decimal comma and maps blanks to null", () => {
    const body = formValuesToBody({
      ...prefillFromSearchParams({}),
      name: "x",
      kcal100: "12,5",
      sugar100: " ",
    });
    expect(body).toMatchObject({ kcal100: 12.5, sugar100: null, barcode: null });
  });
});
