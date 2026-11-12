import { expect, test } from "@playwright/test";

import { blockProductImages } from "./support/helpers";
import { TEST_USER, withDb } from "./support/test-user";

// The main path a new user takes: find a food, build a meal from it, log the meal, see the week.
test("search → build a meal → log it → see it in stats", async ({ page }) => {
  await blockProductImages(page);
  await withDb(async (client) => {
    await client.query(`DELETE FROM "LogEntry" WHERE "userId" = $1`, [TEST_USER.id]);
    await client.query(`DELETE FROM "Meal" WHERE "userId" = $1`, [TEST_USER.id]);
  });

  await page.goto("/");
  await page
    .getByRole("navigation", { name: "ניווט ראשי" })
    .getByRole("link", { name: "חיפוש" })
    .click();
  await page.getByRole("searchbox", { name: "חיפוש מוצר או מותג" }).fill("קוטג");
  await page.getByRole("link", { name: /קוטג' 9%/ }).click();

  await page.getByRole("button", { name: "200 גרם", exact: true }).click();
  await page.getByRole("button", { name: "הוספה לארוחה" }).click();
  const mealDialog = page.getByRole("dialog", { name: "הוספה לארוחה" });
  await mealDialog.getByLabel("ארוחה חדשה").fill("ארוחת מסע");
  await mealDialog.getByRole("button", { name: "יצירה והוספה" }).click();
  await page.getByRole("link", { name: "לארוחה" }).click();

  await expect(page.getByLabel("שם הארוחה")).toHaveValue("ארוחת מסע");
  await expect(page.getByRole("region", { name: "סה״כ לארוחה" })).toContainText("256");

  await page.getByRole("button", { name: "הוספה ליומן" }).click();
  const logDialog = page.getByRole("dialog", { name: "הוספה ליומן" });
  await logDialog.getByText("ארוחת צהריים").click();
  await logDialog.getByRole("button", { name: "רישום ביומן" }).click();
  await page.getByRole("link", { name: "ליומן" }).click();

  const lunch = page.getByRole("region", { name: "ארוחת צהריים" });
  await expect(lunch.getByRole("link", { name: "ארוחת מסע" })).toBeVisible();
  await expect(lunch).toContainText("מנה אחת");
  await expect(lunch).toContainText("256 קק״ל");

  await page
    .getByRole("navigation", { name: "ניווט ראשי" })
    .getByRole("link", { name: "סטטיסטיקה" })
    .click();
  const summary = page.getByRole("region", { name: "סיכום שבועי" });
  await expect(summary.getByRole("row", { name: /קלוריות/ })).toContainText("256");
  await expect(page.getByRole("region", { name: "תובנות" })).toContainText("ארוחת מסע");
});
