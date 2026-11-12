import { describe, expect, it } from "vitest";

import { displayAmount, isSavableAmount, parseAmountInput } from "@/lib/nutrition/amount";

describe("parseAmountInput", () => {
  it("parses numbers and decimals", () => {
    expect(parseAmountInput("150")).toBe(150);
    expect(parseAmountInput(" 12.5 ")).toBe(12.5);
    expect(parseAmountInput("0")).toBe(0);
  });

  it("returns null for empty, invalid and negative input", () => {
    expect(parseAmountInput("")).toBeNull();
    expect(parseAmountInput("abc")).toBeNull();
    expect(parseAmountInput("-5")).toBeNull();
  });
});

describe("displayAmount", () => {
  it("treats invalid input as 0 and caps large values", () => {
    expect(displayAmount("")).toBe(0);
    expect(displayAmount("-1")).toBe(0);
    expect(displayAmount("99999")).toBe(5000);
    expect(displayAmount("250")).toBe(250);
  });
});

describe("isSavableAmount", () => {
  it("accepts amounts above 0 up to 5000", () => {
    expect(isSavableAmount(0.5)).toBe(true);
    expect(isSavableAmount(5000)).toBe(true);
    expect(isSavableAmount(0)).toBe(false);
    expect(isSavableAmount(5000.1)).toBe(false);
    expect(isSavableAmount(null)).toBe(false);
  });
});
