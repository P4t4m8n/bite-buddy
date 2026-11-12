import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { blockProductImages, expectSettled, signedOut } from "./support/helpers";
import { TEST_USER, withDb } from "./support/test-user";

const TZ = "Asia/Jerusalem";

// Fails on serious or critical WCAG A/AA problems on the main screens, in light and dark mode.
const scan = async (page: import("@playwright/test").Page) => {
  await expectSettled(page);
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // Product photos come from Open Food Facts and are blocked in tests.
    .exclude("img[src*='openfoodfacts']")
    .analyze();
  const serious = violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(
    serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
};

let mealId = "";
let foodId = "";

test.beforeAll(async ({ request }) => {
  await withDb((client) => client.query(`DELETE FROM "Meal" WHERE "userId" = $1`, [TEST_USER.id]));
  const search = await request.get(`/api/foods?q=${encodeURIComponent("קוטג' 9%")}`);
  foodId = ((await search.json()) as { items: { id: string }[] }).items[0].id;
  const meal = await request.post("/api/meals", {
    data: { name: "בדיקת נגישות", items: [{ foodId, amount: 100 }] },
  });
  mealId = ((await meal.json()) as { id: string }).id;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
  await request.post("/api/log", {
    data: { date, mealType: "LUNCH", timezone: TZ, foodId, amount: 150 },
  });
});

test.beforeEach(async ({ page }) => {
  await blockProductImages(page);
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });

    for (const [name, path] of [
      ["diary", () => "/"],
      ["search", () => "/search?q=קוטג"],
      ["food", () => `/food/${foodId}`],
      ["meals", () => "/meals"],
      ["meal editor", () => `/meals/${mealId}`],
      ["new food", () => "/foods/new"],
      ["scan", () => "/scan"],
      ["settings", () => "/settings"],
      ["stats", () => "/stats"],
    ] as const) {
      test(`${name} has no serious accessibility issues`, async ({ page }) => {
        await page.goto(path());
        await scan(page);
      });
    }
  });
}

test.describe("signed out", () => {
  test.use(signedOut);

  test("sign-in has no serious accessibility issues", async ({ page }) => {
    await page.goto("/sign-in");
    await scan(page);
  });
});
