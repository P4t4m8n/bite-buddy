import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { blockProductImages, signedOut } from "./support/helpers";
import { deleteUser, SECOND_USER, signInAs, TEST_USER, withDb } from "./support/test-user";

type FoodHit = { id: string; name: string; kcal100: number };

const findFood = async (request: APIRequestContext, query: string): Promise<FoodHit> => {
  const response = await request.get(`/api/foods?q=${encodeURIComponent(query)}`);
  expect(response.ok()).toBe(true);
  const { items } = (await response.json()) as { items: FoodHit[] };
  const food = items.find((item) => item.name === query) ?? items[0];
  expect(food, `no food for ${query}`).toBeTruthy();
  return food;
};

const createMealViaApi = async (
  request: APIRequestContext,
  body: {
    name: string;
    visibility?: "PRIVATE" | "PUBLIC";
    items?: { foodId: string; amount: number }[];
  },
) => {
  const response = await request.post("/api/meals", { data: body });
  expect(response.status()).toBe(201);
  return ((await response.json()) as { id: string }).id;
};

const addFoodInEditor = async (page: Page, query: string, name: string) => {
  await page.getByRole("searchbox", { name: "חיפוש מוצר להוספה" }).fill(query);
  await page
    .getByRole("button", { name: `הוספת ${name}` })
    .first()
    .click();
};

const clearMeals = () =>
  withDb((client) => client.query(`DELETE FROM "Meal" WHERE "userId" = $1`, [TEST_USER.id]));

test.beforeEach(async ({ page }) => {
  await blockProductImages(page);
  await clearMeals();
});

test("build a meal: per-item and total nutrients, reorder, save, persist, delete", async ({
  page,
  request,
}) => {
  const cottage = await findFood(request, "קוטג' 9%");
  const milk = await findFood(request, "חלב");

  await page.goto("/meals");
  await expect(page.getByText("עוד אין לכם ארוחות")).toBeVisible();
  await page.getByRole("link", { name: "ארוחה חדשה" }).click();
  await expect(page).toHaveURL(/\/meals\/new$/);

  await page.getByLabel("שם הארוחה").fill("ארוחת בוקר בדיקה");
  await addFoodInEditor(page, "קוטג", cottage.name);
  await addFoodInEditor(page, milk.name, milk.name);

  // 200 g cottage + 100 (default) of milk.
  await page.getByLabel(`כמות: ${cottage.name}`).fill("200");
  const expectedKcal = Math.round(cottage.kcal100 * 2 + milk.kcal100);
  const totals = page.getByRole("region", { name: "סה״כ לארוחה" });
  await expect(totals).toContainText(`${expectedKcal}`);
  await expect(page.getByRole("listitem").filter({ hasText: cottage.name })).toContainText(
    `${Math.round(cottage.kcal100 * 2)} קק״ל`,
  );

  // Move milk above cottage.
  await page.getByRole("button", { name: `הזזה למעלה: ${milk.name}` }).click();
  const rows = page.locator("ol > li");
  await expect(rows.first()).toContainText(milk.name);

  await page.getByRole("button", { name: "שמירת הארוחה" }).click();
  await expect(page).toHaveURL(/\/meals\/(?!new)[^/]+$/);
  await expect(page.getByRole("heading", { name: "עריכת ארוחה" })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("שם הארוחה")).toHaveValue("ארוחת בוקר בדיקה");
  await expect(page.locator("ol > li").first()).toContainText(milk.name);
  await expect(page.getByLabel(`כמות: ${cottage.name}`)).toHaveValue("200");

  // Toggle public and save.
  const toggle = page.getByRole("switch", { name: "ארוחה ציבורית" });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await toggle.click();
  await page.getByRole("button", { name: "שמירת השינויים" }).click();
  await expect(page.getByText("הארוחה נשמרה.")).toBeVisible();

  await page.goto("/meals");
  const card = page.getByRole("link", { name: /ארוחת בוקר בדיקה/ });
  await expect(card).toContainText("ציבורית");
  await expect(card).toContainText(`${expectedKcal} קק״ל`);

  await card.click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "מחיקת הארוחה" }).click();
  await expect(page).toHaveURL(/\/meals$/);
  await expect(page.getByText("עוד אין לכם ארוחות")).toBeVisible();
});

test("add a food to a meal from the food page", async ({ page, request }) => {
  const cottage = await findFood(request, "קוטג' 9%");
  await createMealViaApi(request, { name: "ארוחה קיימת" });

  await page.goto(`/food/${cottage.id}`);
  await page.getByRole("button", { name: "50 גרם", exact: true }).click();
  await page.getByRole("button", { name: "הוספה לארוחה" }).click();
  const dialog = page.getByRole("dialog", { name: "הוספה לארוחה" });
  await dialog.getByRole("button", { name: "הוספה ל־ארוחה קיימת" }).click();
  await expect(page.getByRole("link", { name: "לארוחה" })).toBeVisible();

  // And into a brand-new meal.
  await page.getByRole("button", { name: "הוספה לארוחה" }).click();
  await dialog.getByLabel("ארוחה חדשה").fill("ארוחה מהמוצר");
  await dialog.getByRole("button", { name: "יצירה והוספה" }).click();
  await page.getByRole("link", { name: "לארוחה" }).click();

  await expect(page.getByLabel("שם הארוחה")).toHaveValue("ארוחה מהמוצר");
  await expect(page.getByLabel(`כמות: ${cottage.name}`)).toHaveValue("50");

  const meals = (await (await request.get("/api/meals")).json()) as {
    items: { name: string; itemCount: number }[];
  };
  expect(meals.items.find((m) => m.name === "ארוחה קיימת")?.itemCount).toBe(1);
});

test("search filters my meals by name", async ({ page, request }) => {
  await createMealViaApi(request, { name: "ארוחת בוקר" });
  await createMealViaApi(request, { name: "ארוחת ערב" });

  await page.goto("/meals");
  const search = page.getByRole("searchbox", { name: "חיפוש ארוחה" });
  await search.fill("בוקר");
  await expect(page).toHaveURL(/\/meals\?q=/);
  await expect(page.getByRole("link", { name: /ארוחת בוקר/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /ארוחת ערב/ })).toHaveCount(0);

  await search.fill("פיצה");
  await expect(page.getByText("לא נמצאו ארוחות עבור ״פיצה״.")).toBeVisible();

  await search.fill("");
  await expect(page).toHaveURL(/\/meals$/);
  await expect(page.getByRole("link", { name: /ארוחת ערב/ })).toBeVisible();
});

test.describe("sharing with a second user", () => {
  test.afterAll(async () => {
    await withDb((client) => deleteUser(client, SECOND_USER));
  });

  test("public meals can be viewed and copied, private ones stay hidden", async ({
    browser,
    request,
  }) => {
    const cottage = await findFood(request, "קוטג' 9%");
    const items = [{ foodId: cottage.id, amount: 150 }];
    const publicId = await createMealViaApi(request, {
      name: "ארוחה משותפת",
      visibility: "PUBLIC",
      items,
    });
    const privateId = await createMealViaApi(request, { name: "ארוחה סודית", items });

    const context = await signInAs(browser, SECOND_USER);
    const other = await context.newPage();
    await blockProductImages(other);

    await other.goto("/meals/public");
    const card = other.getByRole("link", { name: /ארוחה משותפת/ });
    await expect(card).toContainText(`מאת ${TEST_USER.name}`);
    await expect(other.getByText("ארוחה סודית")).toHaveCount(0);

    const publicSearch = other.getByRole("searchbox", { name: "חיפוש ארוחה ציבורית" });
    await publicSearch.fill("משותפת");
    await expect(other).toHaveURL(/\/meals\/public\?q=/);
    await expect(card).toBeVisible();
    await publicSearch.fill("סודית");
    await expect(other.getByText("לא נמצאו ארוחות ציבוריות עבור ״סודית״.")).toBeVisible();
    await publicSearch.fill("משותפת");

    await card.click();
    await expect(other.getByText(`ארוחה ציבורית מאת ${TEST_USER.name}`)).toBeVisible();
    await other.getByRole("button", { name: "שמירת עותק" }).click();
    await expect(other.getByLabel("שם הארוחה")).toHaveValue("ארוחה משותפת (עותק)");
    await expect(other.getByLabel(`כמות: ${cottage.name}`)).toHaveValue("150");

    await other.goto(`/meals/${privateId}`);
    await expect(other.getByRole("heading", { name: "הדף לא נמצא" })).toBeVisible();

    // Writes on someone else's meal: public → 403, private → 404.
    const api = other.request;
    expect((await api.patch(`/api/meals/${publicId}`, { data: { name: "x" } })).status()).toBe(403);
    expect((await api.delete(`/api/meals/${publicId}`)).status()).toBe(403);
    expect((await api.patch(`/api/meals/${privateId}`, { data: { name: "x" } })).status()).toBe(
      404,
    );
    expect((await api.post(`/api/meals/${privateId}/copy`)).status()).toBe(404);

    await context.close();
  });
});

test("rejects invalid meal input", async ({ request }) => {
  const empty = await request.post("/api/meals", { data: { name: "  " } });
  expect(empty.status()).toBe(400);
  const badFood = await request.post("/api/meals", {
    data: { name: "א", items: [{ foodId: "nope", amount: 10 }] },
  });
  expect(badFood.status()).toBe(400);
  const badAmount = await request.post("/api/meals", {
    data: { name: "א", items: [{ foodId: "x", amount: 0 }] },
  });
  expect(badAmount.status()).toBe(400);
});

test.describe("signed out", () => {
  test.use(signedOut);

  test("meal API returns 401", async ({ request }) => {
    expect((await request.get("/api/meals")).status()).toBe(401);
    expect((await request.post("/api/meals", { data: { name: "x" } })).status()).toBe(401);
    expect((await request.delete("/api/meals/abc")).status()).toBe(401);
  });
});
