import { expect, test } from "@playwright/test";

import { blockProductImages, signedOut } from "./support/helpers";

test.describe("signed out", () => {
  test.use(signedOut);

  test("serves the manifest, icons and service worker without a session", async ({ request }) => {
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBe(true);
    const body = (await manifest.json()) as {
      short_name: string;
      dir: string;
      lang: string;
      display: string;
      icons: { src: string; purpose?: string }[];
    };
    expect(body).toMatchObject({
      short_name: "Bite Buddy",
      dir: "rtl",
      lang: "he",
      display: "standalone",
    });
    expect(body.icons.some((icon) => icon.purpose === "maskable")).toBe(true);
    for (const icon of body.icons) {
      const response = await request.get(icon.src);
      expect(response.headers()["content-type"]).toBe("image/png");
    }

    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBe(true);
    expect(sw.headers()["cache-control"]).toContain("no-store");
  });
});

test("works offline: visited pages from cache, others show the offline page", async ({
  page,
  context,
}) => {
  await blockProductImages(page);
  await page.goto("/search?q=קוטג");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first load wasn't controlled by the worker yet; this load goes through it and is cached.
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await expect(page.getByRole("link", { name: /קוטג' 9%/ })).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("link", { name: /קוטג' 9%/ })).toBeVisible();

  await page.goto("/foods/new");
  await expect(page.getByRole("heading", { name: "אין חיבור לאינטרנט" })).toBeVisible();
  await context.setOffline(false);
});

test("settings offers to install the app when the browser allows it", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByLabel("קלוריות")).toBeVisible();
  // Headless Chromium never fires beforeinstallprompt, so the test fires one.
  await page.evaluate(() => {
    const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "הוספה למסך הבית" }).click();
  await expect(page.getByText("האפליקציה מותקנת במכשיר.")).toBeVisible();
});
