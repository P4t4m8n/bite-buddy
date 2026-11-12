import type { NextRequest } from "next/server";

import { parseJsonBody, unauthorized } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { deleteLogEntry, updateLogEntry } from "@/lib/diary/mutations";
import { logResponse } from "@/lib/diary/responses";
import { updateLogEntrySchema } from "@/lib/diary/schemas";

/** PATCH /api/log/[id] — { amount? | servings?, mealType? } on the user's own entry. */
export const PATCH = async (request: NextRequest, { params }: RouteContext<"/api/log/[id]">) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await parseJsonBody(request, updateLogEntrySchema);
  if (body.response) return body.response;

  return logResponse(await updateLogEntry((await params).id, user.id, body.data));
};

/** DELETE /api/log/[id] — the user's own entry. */
export const DELETE = async (_request: NextRequest, { params }: RouteContext<"/api/log/[id]">) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return logResponse(await deleteLogEntry((await params).id, user.id));
};
