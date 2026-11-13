import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";

import type { BetterAuthPlugin } from "better-auth";

/** `.invalid` is a reserved domain, so no Google account can ever claim this address. */
export const DEMO_EMAIL = "demo@bite-buddy.invalid";
export const DEMO_NAME = "משתמש דמו";

/**
 * POST /api/auth/demo/sign-in: one shared account for people who would rather not
 * sign in with Google. Everyone who uses it sees and edits the same data.
 */
export const demoLogin = () =>
  ({
    id: "demo-login",
    endpoints: {
      demoSignIn: createAuthEndpoint("/demo/sign-in", { method: "POST" }, async (ctx) => {
        const adapter = ctx.context.internalAdapter;
        const user =
          (await adapter.findUserByEmail(DEMO_EMAIL))?.user ??
          (await adapter.createUser(
            { email: DEMO_EMAIL, name: DEMO_NAME, emailVerified: true },
            { method: "demo" },
          ));

        const session = await adapter.createSession(user.id);
        await setSessionCookie(ctx, { session, user });
        return ctx.json({ ok: true });
      }),
    },
  }) satisfies BetterAuthPlugin;
