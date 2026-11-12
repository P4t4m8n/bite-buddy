import { NextResponse, type NextRequest } from "next/server";

import { parseJsonBody, unauthorized } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteMeal, updateMeal } from "@/lib/meals/mutations";
import { mealErrorResponse } from "@/lib/meals/responses";
import { updateMealSchema } from "@/lib/meals/schemas";

/**
 * PATCH /api/meals/[id] — updates name, notes or visibility; `items` replaces the list
 * (positions follow its order). Owner only.
 */
export const PATCH = async (request: NextRequest, { params }: RouteContext<"/api/meals/[id]">) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await parseJsonBody(request, updateMealSchema);
  if (body.response) return body.response;

  const result = await updateMeal((await params).id, user.id, body.data);
  if (!result.ok) return mealErrorResponse(result.error);
  return NextResponse.json({ id: result.id });
};

/** DELETE /api/meals/[id] — owner only. */
export const DELETE = async (
  _request: NextRequest,
  { params }: RouteContext<"/api/meals/[id]">,
) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const result = await deleteMeal((await params).id, user.id);
  if (!result.ok) return mealErrorResponse(result.error);
  return NextResponse.json({ id: result.id });
};
