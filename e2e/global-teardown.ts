import { deleteUser, SECOND_USER, TEST_USER, withDb } from "./support/test-user";

// Deleting the users cascades to their sessions, meals, log entries and custom foods.
export default async function globalTeardown() {
  await withDb(async (client) => {
    await deleteUser(client, TEST_USER);
    await deleteUser(client, SECOND_USER);
  });
}
