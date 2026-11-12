import { NextResponse, type NextRequest } from "next/server";

import { parseJsonBody, unauthorized } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { appendMealItem } from "@/lib/meals/mutations";
import { mealErrorResponse } from "@/lib/meals/responses";
import { mealItemInputSchema } from "@/lib/meals/schemas";

/** POST /api/meals/[id]/items — adds { foodId, amount } at the end of the meal. Owner only. */
export const POST = async (
  request: NextRequest,
  { params }: RouteContext<"/api/meals/[id]/items">,
) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await parseJsonBody(request, mealItemInputSchema);
  if (body.response) return body.response;

  const result = await appendMealItem((await params).id, user.id, body.data);
  if (!result.ok) return mealErrorResponse(result.error);
  return NextResponse.json({ id: result.id }, { status: 201 });
};
