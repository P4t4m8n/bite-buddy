import { expect, test } from "@playwright/test";

import { blockProductImages, denyCamera, signedOut } from "./support/helpers";
import { TEST_USER, withDb } from "./support/test-user";

type SeededFood = { id: string; barcode: string; name: string };

// A shared food from the seed, so the lookup never needs Open Food Facts.
const seededFood = () =>
  withDb(async (client) => {
    const { rows } = await client.query<SeededFood>(
      `SELECT id, barcode, name FROM "Food"
       WHERE "createdById" IS NULL AND "hasNutrition" AND barcode ~ '^[0-9]{13}$'
       ORDER BY barcode LIMIT 1`,
    );
    if (!rows[0]) throw new Error("No seeded food with a barcode; run npm run db:seed");
    return rows[0];
  });

test.beforeEach(async ({ page }) => {
  await blockProductImages(page);
  await denyCamera(page);
});

test("manual entry of a seeded barcode opens the food page", async ({ page }) => {
  const food = await seededFood();
  await page.goto("/scan");
  await expect(page.getByText("אין הרשאה להשתמש במצלמה", { exact: false })).toBeVisible();

  await page.getByLabel("הקלדת ברקוד").fill(food.barcode);
  await page.getByRole("button", { name: "חיפוש" }).click();

  await expect(page).toHaveURL(new RegExp(`/food/${food.id}$`));
  await expect(page.getByRole("heading", { level: 1, name: food.name })).toBeVisible();
});

test("manual entry validates the barcode", async ({ page }) => {
  await page.goto("/scan");
  const input = page.getByLabel("הקלדת ברקוד");

  await input.fill("12345");
  await page.getByRole("button", { name: "חיפוש" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveText(
    "ברקוד צריך להכיל 8–14 ספרות.",
  );
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/scan$/);

  // Letters are dropped while typing.
  await input.fill("12ab34");
  await expect(input).toHaveValue("1234");
});

// The browser calls the lookup API, so its response can be faked here without Open Food Facts.
test("an incomplete product links to creating a custom food", async ({ page }) => {
  await page.route("**/api/foods/barcode/**", (route) =>
    route.fulfill({
      json: {
        status: "incomplete",
        prefill: {
          barcode: "7290000000017",
          name: "Hummus",
          brands: [],
          unit: "G",
          packageAmount: 400,
          kcal100: 250,
          protein100: null,
          carbs100: null,
          fat100: null,
          sugar100: null,
          fiber100: null,
          satFat100: null,
          sodium100: null,
        },
      },
    }),
  );
  await page.goto("/scan");
  await page.getByLabel("הקלדת ברקוד").fill("7290000000017");
  await page.getByRole("button", { name: "חיפוש" }).click();

  await expect(page.getByText(/חסרים בו נתונים/)).toBeVisible();
  await expect(page.getByRole("link", { name: "יצירת מוצר" })).toHaveAttribute(
    "href",
    "/foods/new?barcode=7290000000017&name=Hummus&unit=G&packageAmount=400&kcal100=250",
  );

  await page.getByRole("button", { name: "סריקה נוספת" }).click();
  await expect(page.getByText(/חסרים בו נתונים/)).toBeHidden();
});

test("barcode API finds seeded foods and the user's own foods", async ({ request }) => {
  const food = await seededFood();
  const seeded = await request.get(`/api/foods/barcode/${food.barcode}`);
  expect(seeded.ok()).toBe(true);
  expect(await seeded.json()).toMatchObject({
    status: "found",
    food: { id: food.id, name: food.name },
  });

  // Barcodes starting with 2 are reserved for in-store use, so this won't clash with a product.
  const barcode = `2${Date.now().toString().slice(-12).padStart(12, "0")}`;
  const id = `e2e-food-${barcode}`;
  await withDb((client) =>
    client.query(
      `INSERT INTO "Food" (id, barcode, name, brands, categories, allergens, unit, source,
         "createdById", "hasNutrition", "kcal100", "protein100", "carbs100", "fat100", "updatedAt")
       VALUES ($1, $2, 'מוצר בדיקה', '{}', '{}', '{}', 'G', 'USER', $3, true, 100, 10, 10, 2, now())`,
      [id, barcode, TEST_USER.id],
    ),
  );
  const own = await request.get(`/api/foods/barcode/${barcode}`);
  expect(await own.json()).toMatchObject({ status: "found", food: { id, name: "מוצר בדיקה" } });
});

test("barcode API rejects invalid codes", async ({ request }) => {
  for (const code of ["1234567", "123456789012345", "12345678a"]) {
    const response = await request.get(`/api/foods/barcode/${code}`);
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ error: "Invalid barcode" });
  }
});

test.describe("signed out", () => {
  test.use(signedOut);

  test("barcode API returns 401 JSON", async ({ request }) => {
    const response = await request.get("/api/foods/barcode/7290004127329");
    expect(response.status()).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });
});
