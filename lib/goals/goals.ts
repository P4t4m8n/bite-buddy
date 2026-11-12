import { z } from "zod";

export const ACTIVITY_LEVELS = {
  sedentary: { label: "יושבני (מעט או ללא פעילות)", factor: 1.2 },
  light: { label: "פעילות קלה (1–3 אימונים בשבוע)", factor: 1.375 },
  moderate: { label: "פעילות בינונית (3–5 אימונים בשבוע)", factor: 1.55 },
  active: { label: "פעיל (6–7 אימונים בשבוע)", factor: 1.725 },
  veryActive: { label: "פעיל מאוד (עבודה פיזית או אימונים כפולים)", factor: 1.9 },
} as const;

export const GOAL_ADJUSTMENTS = {
  lose: { label: "ירידה במשקל", kcal: -500 },
  maintain: { label: "שמירה על המשקל", kcal: 0 },
  gain: { label: "עלייה במסה", kcal: 300 },
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_LEVELS;
export type GoalType = keyof typeof GOAL_ADJUSTMENTS;

export type BodyProfile = {
  sex: "male" | "female";
  age: number;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  goal: GoalType;
};

export type GoalValues = { kcal: number; proteinG: number; carbsG: number; fatG: number };

const PROTEIN_G_PER_KG = 1.8;
const FAT_SHARE_OF_KCAL = 0.25;
const MIN_KCAL = 1200;

/** Mifflin-St Jeor resting energy, in kcal per day. */
export const restingEnergy = ({ sex, age, weightKg, heightCm }: BodyProfile): number =>
  10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);

/**
 * Suggested daily targets: resting energy × activity, adjusted for the goal, then
 * protein 1.8 g/kg, fat 25% of calories and carbs for the rest.
 */
export const suggestGoals = (profile: BodyProfile): GoalValues => {
  const maintenance = restingEnergy(profile) * ACTIVITY_LEVELS[profile.activity].factor;
  const kcal = Math.max(
    MIN_KCAL,
    Math.round((maintenance + GOAL_ADJUSTMENTS[profile.goal].kcal) / 10) * 10,
  );
  const proteinG = Math.round(profile.weightKg * PROTEIN_G_PER_KG);
  const fatG = Math.round((kcal * FAT_SHARE_OF_KCAL) / 9);
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));
  return { kcal, proteinG, carbsG, fatG };
};

const goalNumber = (label: string, max: number) =>
  z
    .number({ error: `יש להזין ${label}.` })
    .int(`${label} צריך להיות מספר שלם.`)
    .min(0, `${label} לא יכול להיות שלילי.`)
    .max(max, `${label} יכול להיות עד ${max}.`);

/** PUT /api/me/goals */
export const goalsSchema = z.object({
  kcal: goalNumber("יעד קלוריות", 10_000).min(500, "יעד הקלוריות צריך להיות לפחות 500."),
  proteinG: goalNumber("יעד חלבון", 1_000),
  carbsG: goalNumber("יעד פחמימות", 1_500),
  fatG: goalNumber("יעד שומן", 1_000),
});
