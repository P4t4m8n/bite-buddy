import { expect, test } from "@playwright/test";

import { blockProductImages, denyCamera, signedOut } from "./support/helpers";

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
