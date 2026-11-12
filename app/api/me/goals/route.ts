import { NextResponse, type NextRequest } from "next/server";

import { parseJsonBody, unauthorized } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { db } from "@/lib/db";
import { goalsSchema } from "@/lib/goals/goals";

/** PUT /api/me/goals — the user's daily { kcal, proteinG, carbsG, fatG } targets. */
export const PUT = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await parseJsonBody(request, goalsSchema);
  if (body.response) return body.response;

  const goals = await db.userGoals.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...body.data },
    update: body.data,
    select: { kcal: true, proteinG: true, carbsG: true, fatG: true },
  });
  return NextResponse.json(goals);
};
