import { describe, expect, it } from "vitest";
import { hasHebrew } from "@/lib/food/hebrew";

describe("hasHebrew", () => {
  it("detects Hebrew letters, also in mixed text", () => {
    expect(hasHebrew("קוטג׳ 5%")).toBe(true);
    expect(hasHebrew("Coca-Cola קוקה קולה")).toBe(true);
  });

  it("is false for other scripts and Hebrew punctuation alone", () => {
    expect(hasHebrew("Peanut butter")).toBe(false);
    expect(hasHebrew("Паштет")).toBe(false);
    expect(hasHebrew("׳״")).toBe(false);
  });
});
