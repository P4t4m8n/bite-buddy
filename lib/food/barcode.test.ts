import { describe, expect, it } from "vitest";

import { barcodeVariants, createFoodHref, parseBarcode } from "@/lib/food/barcode";

import type { FoodPrefill } from "@/lib/food/barcode";

describe("parseBarcode", () => {
  it("accepts 8 to 14 digits and trims spaces", () => {
    expect(parseBarcode("96385074")).toBe("96385074");
    expect(parseBarcode("036000291452")).toBe("036000291452");
    expect(parseBarcode(" 7290004127329 ")).toBe("7290004127329");
    expect(parseBarcode("17290004127326")).toBe("17290004127326");
  });

  it("rejects other lengths, non-digits and non-strings", () => {
    expect(parseBarcode("1234567")).toBeNull();
    expect(parseBarcode("123456789012345")).toBeNull();
    expect(parseBarcode("72900041273a9")).toBeNull();
    expect(parseBarcode("7290-004127329")).toBeNull();
    expect(parseBarcode("")).toBeNull();
    expect(parseBarcode(undefined)).toBeNull();
    expect(parseBarcode(7290004127329)).toBeNull();
  });
});

describe("barcodeVariants", () => {
  it("pairs UPC-A with its EAN-13 form", () => {
    expect(barcodeVariants("036000291452")).toEqual(["036000291452", "0036000291452"]);
    expect(barcodeVariants("0036000291452")).toEqual(["0036000291452", "036000291452"]);
  });

  it("keeps other codes as they are", () => {
    expect(barcodeVariants("7290004127329")).toEqual(["7290004127329"]);
    expect(barcodeVariants("96385074")).toEqual(["96385074"]);
  });
});

describe("createFoodHref", () => {
  it("links with only the barcode when nothing else is known", () => {
    expect(createFoodHref("7290004127329")).toBe("/foods/new?barcode=7290004127329");
  });

  it("adds the known prefill values and skips unknown ones", () => {
    const prefill: FoodPrefill = {
      barcode: "7290004127329",
      name: "קוטג' 5%",
      brands: ["תנובה", "Tnuva"],
      unit: "G",
      packageAmount: 250,
      kcal100: 95,
      protein100: 11,
      carbs100: null,
      fat100: 5,
      sugar100: null,
      fiber100: null,
      satFat100: null,
      sodium100: 0.35,
    };
    const params = new URL(createFoodHref(prefill.barcode, prefill), "http://x").searchParams;
    expect(Object.fromEntries(params)).toEqual({
      barcode: "7290004127329",
      name: "קוטג' 5%",
      brands: "תנובה, Tnuva",
      unit: "G",
      packageAmount: "250",
      kcal100: "95",
      protein100: "11",
      fat100: "5",
      sodium100: "0.35",
    });
  });
});
