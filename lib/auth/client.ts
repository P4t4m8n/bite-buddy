import { createAuthClient } from "better-auth/react";

/** Browser-side auth calls. They go to the /api/auth/* route handlers. */
export const authClient = createAuthClient();
