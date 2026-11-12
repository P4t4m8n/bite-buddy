import { expect, test, type APIRequestContext } from "@playwright/test";

import { blockProductImages, signedOut } from "./support/helpers";
import { TEST_USER, withDb } from "./support/test-user";

const TZ = "Asia/Jerusalem";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

const logCottage = async (request: APIRequestContext, amount: number) => {
  const search = await request.get(`/api/foods?q=${encodeURIComponent("קוטג' 9%")}`);
  const [food] = ((await search.json()) as { items: { id: string }[] }).items;
  const response = await request.post("/api/log", {
    data: { date: today(), mealType: "LUNCH", timezone: TZ, foodId: food.id, amount },
  });
  expect(response.status()).toBe(201);
};

test.beforeEach(async ({ page }) => {
  await blockProductImages(page);
  await withDb(async (client) => {
    await client.query(`DELETE FROM "LogEntry" WHERE "userId" = $1`, [TEST_USER.id]);
    await client.query(`DELETE FROM "UserGoals" WHERE "userId" = $1`, [TEST_USER.id]);
    await client.query(`UPDATE "User" SET "weekStartsOn" = 'SUNDAY' WHERE id = $1`, [TEST_USER.id]);
  });
});

test("suggest and save daily goals, then see them in the diary", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "תפריט חשבון" }).click();
  await page.getByRole("menuitem", { name: "הגדרות ויעדים" }).click();
  await expect(page).toHaveURL(/\/settings$/);

  await page.getByText("חישוב יעדים מומלצים").click();
  await page.getByLabel("גיל").fill("30");
  await page.getByLabel("משקל (ק״ג)").fill("80");
  await page.getByLabel("גובה (ס״מ)").fill("180");
  await page.getByLabel("רמת פעילות").selectOption("moderate");
  await page.getByRole("button", { name: "מילוי יעדים מומלצים" }).click();

  await expect(page.getByLabel("קלוריות")).toHaveValue("2760");
  await expect(page.getByLabel("חלבון")).toHaveValue("144");
  await expect(page.getByLabel("פחמימות")).toHaveValue("373");
  await expect(page.getByLabel("שומן")).toHaveValue("77");

  await page.getByLabel("קלוריות").fill("2500");
  await page.getByRole("button", { name: "שמירת היעדים" }).click();
  await expect(page.getByText("היעדים נשמרו.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("קלוריות")).toHaveValue("2500");

  await page.goto("/");
  const summary = page.getByRole("region", { name: "סיכום יומי" });
  await expect(summary).toContainText("/ 2500");
  await expect(summary.getByRole("progressbar", { name: "קלוריות" })).toBeVisible();
});

test("weekly stats, insights and week navigation", async ({ page, request }) => {
  await request.put("/api/me/goals", { data: { kcal: 960, proteinG: 80, carbsG: 50, fatG: 60 } });
  await logCottage(request, 500); // 640 kcal
  await logCottage(request, 250); // 320 kcal

  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: "השבוע", exact: true })).toBeVisible();

  const summary = page.getByRole("region", { name: "סיכום שבועי" });
  await expect(summary).toContainText("ממוצע יומי לפי 1 ימים עם רישום.");
  await expect(summary.getByRole("row", { name: /קלוריות/ })).toContainText("960");

  const insights = page.getByRole("region", { name: "תובנות" });
  await expect(insights).toContainText("1/7");
  await expect(insights).toContainText("קוטג' 9% ×2");
  const caloriesChart = page.getByRole("img", { name: "קלוריות לפי יום" });
  await expect(caloriesChart.locator(".recharts-bar-rectangle").first()).toBeVisible();

  await page.getByRole("link", { name: "השבוע הקודם" }).click();
  await expect(page.getByText("עוד לא נרשם כלום השבוע.")).toBeVisible();
  await page.getByRole("link", { name: "השבוע הבא" }).click();
  await expect(page.getByRole("heading", { name: "השבוע", exact: true })).toBeVisible();
});

test("week start setting changes the stats week", async ({ page }) => {
  await page.goto("/settings");
  await page.getByText("יום שני").click();
  await expect(page.getByRole("radio", { name: "יום שני" })).toBeChecked();

  await page.goto("/stats");
  const range = page.getByRole("navigation", { name: "בחירת שבוע" });
  const text = (await range.textContent()) ?? "";
  const [startDay, startMonth] = text
    .match(/(\d+)\.(\d+)–/)!
    .slice(1)
    .map(Number);
  const year = Number(today().slice(0, 4));
  const start = new Date(Date.UTC(year, startMonth - 1, startDay));
  // Monday is weekday 1 (allow a year boundary when the week started in December).
  expect([
    start.getUTCDay(),
    new Date(Date.UTC(year - 1, startMonth - 1, startDay)).getUTCDay(),
  ]).toContain(1);
});

test("goals API validates input", async ({ request }) => {
  const bad = await request.put("/api/me/goals", {
    data: { kcal: 100, proteinG: 1, carbsG: 1, fatG: 1 },
  });
  expect(bad.status()).toBe(400);
});

test.describe("signed out", () => {
  test.use(signedOut);

  test("goals API returns 401", async ({ request }) => {
    const response = await request.put("/api/me/goals", {
      data: { kcal: 2000, proteinG: 1, carbsG: 1, fatG: 1 },
    });
    expect(response.status()).toBe(401);
  });
});
