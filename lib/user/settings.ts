import "server-only";

import { db } from "@/lib/db";

import type { WeekStart } from "@/generated/prisma/enums";

export type UserGoals = { kcal: number; proteinG: number; carbsG: number; fatG: number };

export type UserSettings = {
  timezone: string;
  weekStartsOn: WeekStart;
  goals: UserGoals | null;
};

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      timezone: true,
      weekStartsOn: true,
      goals: { select: { kcal: true, proteinG: true, carbsG: true, fatG: true } },
    },
  });
  return { timezone: user.timezone, weekStartsOn: user.weekStartsOn, goals: user.goals };
};

export const updateUserSettings = (
  userId: string,
  data: { timezone?: string; weekStartsOn?: WeekStart },
) => db.user.update({ where: { id: userId }, data, select: { id: true } });
