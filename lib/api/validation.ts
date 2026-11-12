import type { z } from "zod";

export const INVALID_INPUT_MESSAGE = "הנתונים שנשלחו אינם תקינים.";

/** The first validation message, for showing to the user. */
export const firstIssueMessage = (error: z.ZodError): string =>
  error.issues[0]?.message ?? INVALID_INPUT_MESSAGE;
