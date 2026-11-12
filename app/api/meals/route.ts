import { NextResponse, type NextRequest } from "next/server";

import { parseJsonBody, unauthorized } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createMeal } from "@/lib/meals/mutations";
import { listMyMealOptions } from "@/lib/meals/queries";
import { mealErrorResponse } from "@/lib/meals/responses";
import { createMealSchema } from "@/lib/meals/schemas";

import type { MealOption } from "@/lib/meals/types";

/** GET /api/meals — the user's meals ({ id, name, itemCount }), for the "add to meal" picker. */
export const GET = async () => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return NextResponse.json<{ items: MealOption[] }>({ items: await listMyMealOptions(user.id) });
};

/** POST /api/meals — creates a meal with { name, notes?, visibility?, items: [{ foodId, amount }] }. */
export const POST = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await parseJsonBody(request, createMealSchema);
  if (body.response) return body.response;

  const result = await createMeal(user.id, body.data);
  if (!result.ok) return mealErrorResponse(result.error);
  return NextResponse.json({ id: result.id }, { status: 201 });
};
