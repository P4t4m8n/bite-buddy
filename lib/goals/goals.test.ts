import { describe, expect, it } from "vitest";

import { goalsSchema, restingEnergy, suggestGoals, type BodyProfile } from "@/lib/goals/goals";

const profile: BodyProfile = {
  sex: "male",
  age: 30,
  weightKg: 80,
  heightCm: 180,
  activity: "moderate",
  goal: "maintain",
};

describe("restingEnergy", () => {
  it("uses Mifflin-St Jeor", () => {
    expect(restingEnergy(profile)).toBe(1780);
    expect(restingEnergy({ ...profile, sex: "female" })).toBe(1614);
  });
});

describe("suggestGoals", () => {
  it("multiplies by activity and splits macros", () => {
    // 1780 × 1.55 = 2759 → 2760 kcal; protein 144 g; fat 77 g; carbs the rest.
    expect(suggestGoals(profile)).toEqual({ kcal: 2760, proteinG: 144, fatG: 77, carbsG: 373 });
  });

  it("adjusts for the goal and never goes below 1200 kcal", () => {
    expect(suggestGoals({ ...profile, goal: "lose" }).kcal).toBe(2260);
    const tiny = suggestGoals({
      ...profile,
      sex: "female",
      weightKg: 40,
      heightCm: 140,
      age: 80,
      activity: "sedentary",
      goal: "lose",
    });
    expect(tiny.kcal).toBe(1200);
    expect(tiny.carbsG).toBeGreaterThanOrEqual(0);
  });
});

describe("goalsSchema", () => {
  it("accepts whole-number goals and rejects odd ones", () => {
    expect(
      goalsSchema.safeParse({ kcal: 2000, proteinG: 120, carbsG: 220, fatG: 70 }).success,
    ).toBe(true);
    expect(
      goalsSchema.safeParse({ kcal: 2000.5, proteinG: 120, carbsG: 220, fatG: 70 }).success,
    ).toBe(false);
    expect(goalsSchema.safeParse({ kcal: 300, proteinG: 120, carbsG: 220, fatG: 70 }).success).toBe(
      false,
    );
  });
});
