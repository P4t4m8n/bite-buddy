import { NextResponse, type NextRequest } from "next/server";

import { parseJsonBody, unauthorized } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { customFoodSchema } from "@/lib/food/custom-food";
import { createCustomFood } from "@/lib/food/custom-food-mutations";
import { searchFoods } from "@/lib/food/search";
import { parseFoodSearchParams } from "@/lib/food/search-params";

/** GET /api/foods?q=&page= — food search for client components (e.g. the meal builder). */
export const GET = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { searchParams } = request.nextUrl;
  const { q, page } = parseFoodSearchParams({
    q: searchParams.get("q"),
    page: searchParams.get("page"),
  });

  return NextResponse.json(await searchFoods({ query: q, page, userId: user.id }));
};

/** POST /api/foods — creates a custom food, visible only to its creator. */
export const POST = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await parseJsonBody(request, customFoodSchema);
  if (body.response) return body.response;

  const result = await createCustomFood(user.id, body.data);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Conflict", message: "מוצר עם הברקוד הזה כבר קיים.", existingId: result.existingId },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { id: result.id, barcodeDropped: result.barcodeDropped },
    { status: 201 },
  );
};
