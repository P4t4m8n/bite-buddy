import { expect, test, type APIRequestContext } from "@playwright/test";

import { blockProductImages, signedOut } from "./support/helpers";
import { deleteUser, SECOND_USER, signInAs, TEST_USER, withDb } from "./support/test-user";

const TZ = "Asia/Jerusalem";

const dateKey = (offsetDays = 0) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(
    new Date(Date.now() + offsetDays * 86_400_000),
  );

const findFood = async (request: APIRequestContext, name: string) => {
  const response = await request.get(`/api/foods?q=${encodeURIComponent(name)}`);
  const { items } = (await response.json()) as {
    items: { id: string; name: string; kcal100: number }[];
  };
  return items.find((item) => item.name === name) ?? items[0];
};

const section = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("region", { name });

test.beforeEach(async ({ page }) => {
  await blockProductImages(page);
  await withDb(async (client) => {
    await client.query(`DELETE FROM "LogEntry" WHERE "userId" = $1`, [TEST_USER.id]);
    await client.query(`DELETE FROM "Meal" WHERE "userId" = $1`, [TEST_USER.id]);
  });
});

test.afterAll(async () => {
  await withDb((client) => deleteUser(client, SECOND_USER));
});

test("log a food from its page, then edit and delete it in the diary", async ({
  page,
  request,
}) => {
  const cottage = await findFood(request, "קוטג' 9%");

  await page.goto(`/food/${cottage.id}`);
  await page.getByRole("button", { name: "200 גרם", exact: true }).click();
  await page.getByRole("button", { name: "הוספה ליומן" }).click();
  const dialog = page.getByRole("dialog", { name: "הוספה ליומן" });
  await expect(dialog.getByLabel("תאריך")).toHaveValue(dateKey());
  await dialog.getByText("ארוחת צהריים").click();
  await dialog.getByRole("button", { name: "רישום ביומן" }).click();

  await expect(page.getByText(`${cottage.name} נוסף לארוחת צהריים`)).toBeVisible();
  await page.getByRole("link", { name: "ליומן" }).click();
  await expect(page).toHaveURL(/\/$/);

  const lunch = section(page, "ארוחת צהריים");
  await expect(lunch.getByRole("link", { name: cottage.name })).toBeVisible();
  await expect(lunch).toContainText("200 גרם");
  await expect(lunch).toContainText("256 קק״ל");
  await expect(page.getByRole("region", { name: "סיכום יומי" })).toContainText("256");

  await lunch.getByRole("button", { name: `עריכת כמות: ${cottage.name}` }).click();
  await lunch.getByLabel(`כמות: ${cottage.name}`, { exact: true }).fill("100");
  await lunch.getByRole("button", { name: "שמירה" }).click();
  await expect(lunch).toContainText("100 גרם");
  await expect(lunch).toContainText("128 קק״ל");

  page.once("dialog", (confirm) => confirm.accept());
  await lunch.getByRole("button", { name: `מחיקה: ${cottage.name}` }).click();
  await expect(lunch.getByText("עוד לא נרשם כלום.")).toBeVisible();
});

test("log a saved meal by servings; the entry keeps its values when the meal changes", async ({
  page,
  request,
}) => {
  const cottage = await findFood(request, "קוטג' 9%");
  const created = await request.post("/api/meals", {
    data: { name: "קוטג' לערב", items: [{ foodId: cottage.id, amount: 100 }] },
  });
  const { id: mealId } = (await created.json()) as { id: string };

  await page.goto(`/meals/${mealId}`);
  await page.getByRole("button", { name: "הוספה ליומן" }).click();
  const dialog = page.getByRole("dialog", { name: "הוספה ליומן" });
  await dialog.getByText("ארוחת ערב").click();
  await dialog.getByLabel("מספר מנות").fill("2");
  await dialog.getByRole("button", { name: "רישום ביומן" }).click();
  await expect(page.getByText("קוטג' לערב נוסף לארוחת ערב")).toBeVisible();

  await request.patch(`/api/meals/${mealId}`, {
    data: { items: [{ foodId: cottage.id, amount: 500 }] },
  });

  await page.goto("/");
  const dinner = section(page, "ארוחת ערב");
  await expect(dinner).toContainText("2 מנות");
  await expect(dinner).toContainText("256 קק״ל");
});

test("navigate between days", async ({ page, request }) => {
  const cottage = await findFood(request, "קוטג' 9%");
  const logged = await request.post("/api/log", {
    data: {
      date: dateKey(-1),
      mealType: "BREAKFAST",
      timezone: TZ,
      foodId: cottage.id,
      amount: 50,
    },
  });
  expect(logged.status()).toBe(201);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "היום" })).toBeVisible();
  await expect(section(page, "ארוחת בוקר").getByText("עוד לא נרשם כלום.")).toBeVisible();

  await page.getByRole("link", { name: "היום הקודם" }).click();
  await expect(page).toHaveURL(new RegExp(`\\?date=${dateKey(-1)}`));
  await expect(page.getByRole("heading", { level: 1, name: "אתמול" })).toBeVisible();
  await expect(section(page, "ארוחת בוקר")).toContainText("64 קק״ל");

  await page.getByRole("link", { name: "חזרה להיום" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "היום" })).toBeVisible();
});

test("diary API validates input and protects other users' entries", async ({
  request,
  browser,
}) => {
  const cottage = await findFood(request, "קוטג' 9%");
  const bad = await request.post("/api/log", {
    data: { date: "2026-02-30", mealType: "LUNCH", foodId: cottage.id, amount: 10 },
  });
  expect(bad.status()).toBe(400);
  const unknownFood = await request.post("/api/log", {
    data: { date: dateKey(), mealType: "LUNCH", foodId: "nope", amount: 10 },
  });
  expect(unknownFood.status()).toBe(400);

  const created = await request.post("/api/log", {
    data: { date: dateKey(), mealType: "LUNCH", foodId: cottage.id, amount: 10 },
  });
  const { id } = (await created.json()) as { id: string };

  const context = await signInAs(browser, SECOND_USER);
  const other = context.request;
  expect((await other.patch(`/api/log/${id}`, { data: { amount: 5 } })).status()).toBe(404);
  expect((await other.delete(`/api/log/${id}`)).status()).toBe(404);
  await context.close();
});

test.describe("signed out", () => {
  test.use(signedOut);

  test("diary API returns 401", async ({ request }) => {
    expect((await request.post("/api/log", { data: {} })).status()).toBe(401);
    expect((await request.patch("/api/log/x", { data: { amount: 1 } })).status()).toBe(401);
    expect((await request.patch("/api/me", { data: { timezone: TZ } })).status()).toBe(401);
  });
});
