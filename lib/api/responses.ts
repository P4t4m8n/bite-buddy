import { NextResponse } from "next/server";

import { firstIssueMessage, INVALID_INPUT_MESSAGE } from "@/lib/api/validation";

import type { z } from "zod";

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export const invalidInput = (message: string) =>
  NextResponse.json({ error: "Invalid input", message }, { status: 400 });

/** Reads and validates a JSON body; a malformed body is a 400 like any other invalid input. */
export const parseJsonBody = async <S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ data: z.output<S>; response?: never } | { data?: never; response: NextResponse }> => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { response: invalidInput(INVALID_INPUT_MESSAGE) };
  }
  const result = schema.safeParse(body);
  if (!result.success) return { response: invalidInput(firstIssueMessage(result.error)) };
  return { data: result.data };
};
