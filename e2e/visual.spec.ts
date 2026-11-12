import { expect, test } from "@playwright/test";

import { blockProductImages, denyCamera, signedOut } from "./support/helpers";
import { TEST_USER, withDb } from "./support/test-user";

// Visual regression snapshots. Update baselines after intended UI changes with
// `npm run test:e2e:update`.

test.beforeEach(async ({ page }) => {
  await blockProductImages(page);
});

test.describe("signed out", () => {
  test.use(signedOut);

  test("sign-in page", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("button", { name: "המשך עם Google" })).toBeEnabled();
    await expect(page).toHaveScreenshot("sign-in.png");
  });
});

test("search results", async ({ page }) => {
  await page.goto("/search?q=קוטג");
  await expect(page.getByRole("link", { name: /קוטג' 9%/ })).toBeVisible();
  await expect(page).toHaveScreenshot("search-results.png");
});

test("food page", async ({ page }) => {
  await page.goto("/search?q=קוטג");
  await page.getByRole("link", { name: /קוטג' 9%/ }).click();
  await expect(page.getByRole("row", { name: /קלוריות/ })).toBeVisible();
  await expect(page).toHaveScreenshot("food.png");
});

test("scan page without a camera", async ({ page }) => {
  await denyCamera(page);
  await page.goto("/scan");
  await expect(page.getByText("אין הרשאה להשתמש במצלמה", { exact: false })).toBeVisible();
  await expect(page.getByLabel("הקלדת ברקוד")).toBeVisible();
  await expect(page).toHaveScreenshot("scan.png");
});

test.describe("meals", () => {
  test.beforeEach(async ({ request }) => {
    await withDb((client) =>
      client.query(`DELETE FROM "Meal" WHERE "userId" = $1`, [TEST_USER.id]),
    );
    const search = await request.get(`/api/foods?q=${encodeURIComponent("קוטג' 9%")}`);
    const [food] = ((await search.json()) as { items: { id: string }[] }).items;
    const response = await request.post("/api/meals", {
      data: { name: "ארוחת בוקר", visibility: "PUBLIC", items: [{ foodId: food.id, amount: 200 }] },
    });
    mealId = ((await response.json()) as { id: string }).id;
  });

  let mealId = "";

  test("meals list", async ({ page }) => {
    await page.goto("/meals");
    await expect(page.getByRole("link", { name: /ארוחת בוקר/ })).toBeVisible();
    await expect(page).toHaveScreenshot("meals.png");
  });

  test("meal editor", async ({ page }) => {
    await page.goto(`/meals/${mealId}`);
    await expect(page.getByLabel("שם הארוחה")).toHaveValue("ארוחת בוקר");
    await expect(page).toHaveScreenshot("meal-editor.png", { fullPage: true });
  });
});
