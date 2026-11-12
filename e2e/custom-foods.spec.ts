import { expect, test } from "@playwright/test";

import { blockProductImages, signedOut } from "./support/helpers";
import { deleteUser, SECOND_USER, signInAs, TEST_USER, withDb } from "./support/test-user";

const clearCustomFoods = () =>
  withDb((client) => client.query(`DELETE FROM "Food" WHERE "createdById" = $1`, [TEST_USER.id]));

test.beforeEach(async ({ page }) => {
  await blockProductImages(page);
  await clearCustomFoods();
});

test.afterAll(async () => {
  await clearCustomFoods();
  await withDb((client) => deleteUser(client, SECOND_USER));
});

test("create a custom food from an empty search and find it again", async ({ page, browser }) => {
  await page.goto("/search?q=סלט טחינה של סבתא");
  await expect(page.getByText(/לא נמצאו מוצרים/)).toBeVisible();
  await page.getByRole("link", { name: /הוספת מוצר חדש/ }).click();

  await expect(page.getByLabel("שם המוצר")).toHaveValue("סלט טחינה של סבתא");
  await page.getByLabel("קלוריות").fill("300");
  await page.getByLabel("חלבונים").fill("8");
  await page.getByLabel("פחמימות", { exact: true }).fill("10");
  await page.getByLabel("שומנים", { exact: true }).fill("26");
  await page.getByLabel(/נתרן/).fill("450");
  await page.getByRole("button", { name: "שמירת המוצר" }).click();

  await expect(page).toHaveURL(/\/food\//);
  await expect(page.getByRole("heading", { level: 1, name: "סלט טחינה של סבתא" })).toBeVisible();
  await expect(page.getByText("מוצר אישי")).toBeVisible();
  await expect(page.getByRole("row", { name: /נתרן/ })).toContainText("450 מ״ג");
  const foodUrl = page.url();

  await page.goto("/search?q=טחינה של סבתא");
  await expect(page.getByRole("link", { name: /סלט טחינה של סבתא/ })).toBeVisible();

  // Custom foods are private.
  const context = await signInAs(browser, SECOND_USER);
  const other = await context.newPage();
  const search = await other.request.get(`/api/foods?q=${encodeURIComponent("טחינה של סבתא")}`);
  expect(((await search.json()) as { items: unknown[] }).items).toHaveLength(0);
  await other.goto(foodUrl);
  await expect(other.getByRole("heading", { name: "הדף לא נמצא" })).toBeVisible();
  await context.close();
});

test("validates the form", async ({ page }) => {
  await page.goto("/foods/new");
  await page.getByRole("button", { name: "שמירת המוצר" }).click();
  await expect(page.getByText("יש להזין שם מוצר.")).toBeVisible();

  await page.getByLabel("שם המוצר").fill("מוצר שגוי");
  await page.getByLabel("קלוריות").fill("100");
  await page.getByLabel("חלבונים").fill("60");
  await page.getByLabel("פחמימות", { exact: true }).fill("30");
  await page.getByLabel("שומנים", { exact: true }).fill("20");
  await page.getByRole("button", { name: "שמירת המוצר" }).click();
  await expect(page.getByText(/לא יכול לעלות על 100/)).toBeVisible();
});

test("a scan prefill creates a food the barcode lookup then finds", async ({ page, request }) => {
  const barcode = "7290099999991";
  await page.goto(
    `/foods/new?barcode=${barcode}&name=${encodeURIComponent("משקה בדיקה")}&unit=ML&kcal100=42&carbs100=10.6&protein100=0&fat100=0`,
  );
  await expect(page.getByLabel("ברקוד")).toHaveValue(barcode);
  await expect(page.getByLabel("קלוריות")).toHaveValue("42");
  await expect(page.getByRole("radio", { name: "מ״ל (משקה)" })).toBeChecked();
  await page.getByRole("button", { name: "שמירת המוצר" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "משקה בדיקה" })).toBeVisible();

  const lookup = await request.get(`/api/foods/barcode/${barcode}`);
  const body = (await lookup.json()) as { status: string; food?: { name: string } };
  expect(body).toMatchObject({ status: "found", food: { name: "משקה בדיקה" } });

  // The same barcode again points at the existing food.
  const again = await request.post("/api/foods", {
    data: { name: "כפול", unit: "ML", barcode, kcal100: 1, protein100: 0, carbs100: 0, fat100: 0 },
  });
  expect(again.status()).toBe(409);
});

test.describe("signed out", () => {
  test.use(signedOut);

  test("create food API returns 401", async ({ request }) => {
    const response = await request.post("/api/foods", { data: { name: "x" } });
    expect(response.status()).toBe(401);
  });
});
