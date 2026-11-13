import { expect, test } from "@playwright/test";

import { signedOut } from "./support/helpers";

test.describe("signed out", () => {
  test.use(signedOut);

  test("redirects app pages to sign-in and keeps the target", async ({ page }) => {
    await page.goto("/meals");
    await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fmeals/);
    await expect(page.getByRole("heading", { name: /ברוכים הבאים/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "המשך עם Google" })).toBeEnabled();
  });

  test("demo account signs in without Google and keeps the target", async ({ page }) => {
    await page.goto("/meals");
    await page.getByRole("button", { name: "כניסה למשתמש דמו" }).click();
    await expect(page).toHaveURL(/\/meals$/);

    await page.getByRole("button", { name: "תפריט חשבון" }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toContainText("משתמש דמו");
    await expect(menu).not.toContainText("@");
  });

  test("API routes return 401 JSON", async ({ request }) => {
    const response = await request.get("/api/foods?q=חלב");
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });
});

test.describe("signed in", () => {
  test("renders the app in Hebrew, right to left", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(page.getByRole("heading", { level: 1, name: "היום" })).toBeVisible();
    await expect(page.getByRole("button", { name: "תפריט חשבון" })).toBeVisible();
  });

  test("sign-in page sends signed-in users home", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/$/);
  });
});
