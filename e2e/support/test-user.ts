import "dotenv/config";

import { createHmac, randomBytes } from "node:crypto";

import { Client } from "pg";

/** A throwaway user for E2E tests. Everything it owns is deleted in teardown. */
export const TEST_USER = {
  id: "e2e-test-user",
  name: "משתמש בדיקה",
  email: "e2e-test@bitebuddy.local",
} as const;

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

export const deleteTestUser = (client: Client) =>
  client.query(`DELETE FROM "User" WHERE id = $1 OR email = $2`, [TEST_USER.id, TEST_USER.email]);

/**
 * Creates the test user and a database session, and returns the session cookie value
 * signed the same way Better Auth signs it (HMAC-SHA256 with BETTER_AUTH_SECRET).
 */
export const createTestSession = async (client: Client): Promise<string> => {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is not set");

  await deleteTestUser(client);
  await client.query(
    `INSERT INTO "User" (id, name, email, "emailVerified", "updatedAt") VALUES ($1, $2, $3, true, now())`,
    [TEST_USER.id, TEST_USER.name, TEST_USER.email],
  );

  const token = randomBytes(24).toString("base64url");
  await client.query(
    `INSERT INTO "Session" (id, token, "userId", "expiresAt", "updatedAt")
     VALUES ($1, $2, $3, now() + interval '2 hours', now())`,
    [randomBytes(16).toString("hex"), token, TEST_USER.id],
  );

  const signature = createHmac("sha256", secret).update(token).digest("base64");
  return encodeURIComponent(`${token}.${signature}`);
};
