import type { NextRequest } from "next/server";

import { parseJsonBody, unauthorized } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { createLogEntry } from "@/lib/diary/mutations";
import { logResponse } from "@/lib/diary/responses";
import { createLogEntrySchema } from "@/lib/diary/schemas";

/**
 * POST /api/log — logs a food { foodId, amount } or a meal { mealId, servings }
 * on { date: "YYYY-MM-DD", mealType }, optionally sending the browser's { timezone }.
 */
export const POST = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await parseJsonBody(request, createLogEntrySchema);
  if (body.response) return body.response;

  return logResponse(await createLogEntry(user.id, body.data), 201);
};
