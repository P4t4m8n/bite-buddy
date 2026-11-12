import "dotenv/config";

import { createHmac, randomBytes } from "node:crypto";

import { Client } from "pg";

import type { Browser, BrowserContext } from "@playwright/test";

export type E2EUser = { id: string; name: string; email: string };

/** A throwaway user for E2E tests. Everything it owns is deleted in teardown. */
export const TEST_USER = {
  id: "e2e-test-user",
  name: "משתמש בדיקה",
  email: "e2e-test@bitebuddy.local",
} as const satisfies E2EUser;

/** A second user for visibility and ownership tests (see `signInAs`). */
export const SECOND_USER = {
  id: "e2e-second-user",
  name: "משתמשת שנייה",
  email: "e2e-second@bitebuddy.local",
} as const satisfies E2EUser;

export const SESSION_COOKIE = "better-auth.session_token";
export const STORAGE_STATE_PATH = "e2e/.auth/user.json";

export const withDb = async <T>(fn: (client: Client) => Promise<T>): Promise<T> => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
};

/** Deletes the user; sessions, meals, log entries and custom foods cascade. */
export const deleteUser = (client: Client, user: E2EUser) =>
  client.query(`DELETE FROM "User" WHERE id = $1 OR email = $2`, [user.id, user.email]);

export const deleteTestUser = (client: Client) => deleteUser(client, TEST_USER);

/**
 * (Re)creates the user and a database session, and returns the session cookie value
 * signed the same way Better Auth signs it (HMAC-SHA256 with BETTER_AUTH_SECRET).
 */
export const createUserSession = async (client: Client, user: E2EUser): Promise<string> => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");

  await deleteUser(client, user);
  await client.query(
    `INSERT INTO "User" (id, name, email, "emailVerified", "updatedAt") VALUES ($1, $2, $3, true, now())`,
    [user.id, user.name, user.email],
  );

  const token = randomBytes(24).toString("base64url");
  await client.query(
    `INSERT INTO "Session" (id, token, "userId", "expiresAt", "updatedAt")
     VALUES ($1, $2, $3, now() + interval '2 hours', now())`,
    [randomBytes(16).toString("hex"), token, user.id],
  );

  const signature = createHmac("sha256", secret).update(token).digest("base64");
  return encodeURIComponent(`${token}.${signature}`);
};

export const createTestSession = (client: Client) => createUserSession(client, TEST_USER);

export const sessionCookie = (value: string) => ({
  name: SESSION_COOKIE,
  value,
  domain: "localhost",
  path: "/",
  expires: -1,
  httpOnly: true,
  secure: false,
  sameSite: "Lax" as const,
});

/**
 * A browser context signed in as another user (created in the database here).
 * Close the context and call `deleteUser` in afterAll.
 */
export const signInAs = async (browser: Browser, user: E2EUser): Promise<BrowserContext> => {
  const cookieValue = await withDb((client) => createUserSession(client, user));
  return browser.newContext({
    storageState: { cookies: [sessionCookie(cookieValue)], origins: [] },
  });
};
