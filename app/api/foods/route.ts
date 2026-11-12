import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { searchFoods } from "@/lib/food/search";
import { parseFoodSearchParams } from "@/lib/food/search-params";

/** GET /api/foods?q=&page= — food search for client components (e.g. the meal builder). */
export const GET = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const { q, page } = parseFoodSearchParams({
    q: searchParams.get("q"),
    page: searchParams.get("page"),
  });

  return NextResponse.json(await searchFoods({ query: q, page, userId: user.id }));
};
