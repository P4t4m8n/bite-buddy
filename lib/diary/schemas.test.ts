import { describe, expect, it } from "vitest";

import { createLogEntrySchema, updateLogEntrySchema } from "@/lib/diary/schemas";

const base = { date: "2026-11-12", mealType: "LUNCH" };

describe("createLogEntrySchema", () => {
  it("accepts a food with an amount or a meal with servings", () => {
    expect(createLogEntrySchema.safeParse({ ...base, foodId: "f", amount: 150 }).success).toBe(
      true,
    );
    expect(createLogEntrySchema.safeParse({ ...base, mealId: "m", servings: 1.5 }).success).toBe(
      true,
    );
  });

  it("rejects both, neither, or a half target", () => {
    expect(createLogEntrySchema.safeParse(base).success).toBe(false);
    expect(createLogEntrySchema.safeParse({ ...base, foodId: "f" }).success).toBe(false);
    expect(
      createLogEntrySchema.safeParse({ ...base, foodId: "f", amount: 1, mealId: "m", servings: 1 })
        .success,
    ).toBe(false);
  });

  it("validates date, meal type, amounts and time zone", () => {
    const food = { foodId: "f", amount: 100 };
    expect(createLogEntrySchema.safeParse({ ...base, ...food, date: "2026-02-30" }).success).toBe(
      false,
    );
    expect(createLogEntrySchema.safeParse({ ...base, ...food, mealType: "BRUNCH" }).success).toBe(
      false,
    );
    expect(createLogEntrySchema.safeParse({ ...base, foodId: "f", amount: 0 }).success).toBe(false);
    expect(createLogEntrySchema.safeParse({ ...base, mealId: "m", servings: 21 }).success).toBe(
      false,
    );
    expect(
      createLogEntrySchema.safeParse({ ...base, ...food, timezone: "Nowhere/X" }).success,
    ).toBe(false);
  });
});

describe("updateLogEntrySchema", () => {
  it("needs at least one change", () => {
    expect(updateLogEntrySchema.safeParse({}).success).toBe(false);
    expect(updateLogEntrySchema.safeParse({ mealType: "DINNER" }).success).toBe(true);
  });
});
