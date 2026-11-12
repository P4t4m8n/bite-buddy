import { NextResponse } from "next/server";

import { invalidInput } from "@/lib/api/responses";

import type { LogWriteResult } from "@/lib/diary/mutations";

/** HTTP response for a diary write. */
export const logResponse = (result: LogWriteResult, status = 200) => {
  if (result.ok) return NextResponse.json({ id: result.id }, { status });
  if (result.error === "not_found") {
    return NextResponse.json({ error: "Not found", message: "הרשומה לא נמצאה." }, { status: 404 });
  }
  return invalidInput("המוצר או הארוחה לא נמצאו.");
};
