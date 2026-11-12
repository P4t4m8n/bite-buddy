import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { parseJsonBody, unauthorized } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/current-user";
import { timeZoneSchema } from "@/lib/diary/schemas";
import { updateUserSettings } from "@/lib/user/settings";

const settingsSchema = z
  .object({
    timezone: timeZoneSchema.optional(),
    weekStartsOn: z.enum(["SUNDAY", "MONDAY"], { error: "יום תחילת שבוע לא תקין." }).optional(),
  })
  .refine((body) => body.timezone !== undefined || body.weekStartsOn !== undefined, {
    error: "אין שינויים לשמירה.",
  });

/** PATCH /api/me — the user's time zone and week start. */
export const PATCH = async (request: NextRequest) => {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await parseJsonBody(request, settingsSchema);
  if (body.response) return body.response;

  await updateUserSettings(user.id, body.data);
  return NextResponse.json({ ok: true });
};
