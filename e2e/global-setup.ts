import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { createTestSession, SESSION_COOKIE, STORAGE_STATE_PATH, withDb } from "./support/test-user";

export default async function globalSetup() {
  const cookieValue = await withDb(createTestSession);

  mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });
  writeFileSync(
    STORAGE_STATE_PATH,
    JSON.stringify({
      cookies: [
        {
          name: SESSION_COOKIE,
          value: cookieValue,
          domain: "localhost",
          path: "/",
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }),
  );
}
