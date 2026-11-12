import { NextResponse, type NextRequest } from "next/server";

import { unauthorized } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { copyMeal } from "@/lib/meals/mutations";
import { mealErrorResponse } from "@/lib/meals/responses";

/** POST /api/meals/[id]/copy — saves a private copy of a public (or own) meal. */
export const POST = async (
  _request: NextRequest,
  { params }: RouteContext<"/api/meals/[id]/copy">,
) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const result = await copyMeal((await params).id, user.id);
  if (!result.ok) return mealErrorResponse(result.error);
  return NextResponse.json({ id: result.id }, { status: 201 });
};
