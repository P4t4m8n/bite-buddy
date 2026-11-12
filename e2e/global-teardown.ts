import { deleteTestUser, withDb } from "./support/test-user";

// Deleting the user cascades to its sessions, meals, log entries and custom foods.
export default async function globalTeardown() {
  await withDb(deleteTestUser);
}
