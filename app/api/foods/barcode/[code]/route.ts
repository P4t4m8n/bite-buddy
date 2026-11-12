import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { BARCODE_ERROR, parseBarcode } from "@/lib/food/barcode";
import { lookupBarcode } from "@/lib/food/barcode-lookup";

import type { BarcodeLookupResult } from "@/lib/food/barcode";

/**
 * GET /api/foods/barcode/[code] — finds a food by barcode in the database, then on
 * Open Food Facts (saving complete Hebrew products). See `lookupBarcode`.
 */
export const GET = async (
  _request: NextRequest,
  { params }: RouteContext<"/api/foods/barcode/[code]">,
) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = parseBarcode((await params).code);
  if (!code) {
    return NextResponse.json({ error: "Invalid barcode", message: BARCODE_ERROR }, { status: 400 });
  }

  return NextResponse.json<BarcodeLookupResult>(await lookupBarcode(code, user.id));
};
