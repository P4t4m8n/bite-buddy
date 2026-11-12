import { describe, expect, it } from "vitest";

import { firstIssueMessage } from "@/lib/api/validation";
import { createMealSchema, updateMealSchema } from "@/lib/meals/schemas";

describe("createMealSchema", () => {
  it("applies defaults and trims", () => {
    expect(createMealSchema.parse({ name: "  ארוחת בוקר " })).toEqual({
      name: "ארוחת בוקר",
      notes: null,
      visibility: "PRIVATE",
      items: [],
    });
  });

  it("stores empty notes as null", () => {
    expect(createMealSchema.parse({ name: "x", notes: "  " }).notes).toBeNull();
    expect(createMealSchema.parse({ name: "x", notes: " חם " }).notes).toBe("חם");
  });

  it("rejects an empty or too long name with a Hebrew message", () => {
    const empty = createMealSchema.safeParse({ name: "   " });
    expect(empty.success).toBe(false);
    if (!empty.success) expect(firstIssueMessage(empty.error)).toBe("יש להזין שם לארוחה.");

    expect(createMealSchema.safeParse({ name: "א".repeat(81) }).success).toBe(false);
    expect(createMealSchema.safeParse({}).success).toBe(false);
  });

  it("checks item amounts (above 0, at most 5000)", () => {
    const item = (amount: unknown) =>
      createMealSchema.safeParse({ name: "x", items: [{ foodId: "f1", amount }] }).success;
    expect(item(0.5)).toBe(true);
    expect(item(5000)).toBe(true);
    expect(item(0)).toBe(false);
    expect(item(-1)).toBe(false);
    expect(item(5001)).toBe(false);
    expect(item("100")).toBe(false);
  });

  it("rejects unknown visibility values and too many items", () => {
    expect(createMealSchema.safeParse({ name: "x", visibility: "FRIENDS" }).success).toBe(false);
    const items = Array.from({ length: 51 }, () => ({ foodId: "f", amount: 1 }));
    expect(createMealSchema.safeParse({ name: "x", items }).success).toBe(false);
  });
});

describe("updateMealSchema", () => {
  it("accepts a single field", () => {
    expect(updateMealSchema.parse({ visibility: "PUBLIC" })).toEqual({ visibility: "PUBLIC" });
    expect(updateMealSchema.parse({ items: [] })).toEqual({ items: [] });
  });

  it("allows clearing notes", () => {
    expect(updateMealSchema.parse({ notes: null })).toEqual({ notes: null });
  });

  it("rejects an empty body", () => {
    const result = updateMealSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) expect(firstIssueMessage(result.error)).toBe("אין שינויים לשמירה.");
  });
});
