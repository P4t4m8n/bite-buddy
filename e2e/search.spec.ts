import { expect, test } from "@playwright/test";

import { blockProductImages } from "./support/helpers";

test.beforeEach(async ({ page }) => {
  await blockProductImages(page);
});

test("search, open a food, scale the amount and go back", async ({ page }) => {
  await page.goto("/search");
  await page.getByRole("searchbox", { name: "חיפוש מוצר או מותג" }).fill("קוטג");

  await expect(page).toHaveURL(/\?q=%D7%A7%D7%95%D7%98%D7%92/);
  const result = page.getByRole("link", { name: /קוטג' 9%/ });
  await expect(result).toBeVisible();

  await result.click();
  await expect(page).toHaveURL(/\/food\//);
  await expect(page.getByRole("heading", { level: 1, name: "קוטג' 9%" })).toBeVisible();

  // 128 kcal per 100 g, so 200 g is 256 kcal.
  await page.getByRole("button", { name: "200 גרם" }).click();
  const caloriesRow = page.getByRole("row", { name: /קלוריות/ });
  await expect(caloriesRow).toContainText("128 קק״ל");
  await expect(caloriesRow).toContainText("256 קק״ל");

  await page.getByRole("button", { name: "חזרה" }).click();
  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.getByRole("searchbox")).toHaveValue("קוטג");
});

test("shows a hint for short queries and an empty state", async ({ page }) => {
  await page.goto("/search?q=א");
  await expect(page.getByText("הקלידו לפחות 2 תווים כדי לחפש.")).toBeVisible();

  await page.goto("/search?q=zzzzqqq");
  await expect(page.getByText(/לא נמצאו מוצרים/)).toBeVisible();
});

test("foods API paginates", async ({ request }) => {
  const response = await request.get("/api/foods?q=חלב&page=1");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.items).toHaveLength(20);
  expect(body.hasMore).toBe(true);
});

test("unknown food id shows the not-found page", async ({ page }) => {
  // The food loads inside <Suspense>, so the response has already streamed with 200;
  // Next.js renders the not-found UI in place (with noindex).
  await page.goto("/food/does-not-exist");
  await expect(page.getByRole("heading", { name: "הדף לא נמצא" })).toBeVisible();
});
