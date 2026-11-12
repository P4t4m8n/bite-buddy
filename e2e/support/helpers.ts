import type { Page } from "@playwright/test";

/**
 * Open Food Facts images are slow and change over time. Blocking them makes the
 * FoodImage placeholder render instead, so tests and screenshots are deterministic.
 */
export const blockProductImages = (page: Page) =>
  page.route("https://images.openfoodfacts.org/**", (route) => route.abort());

export const signedOut = { storageState: { cookies: [], origins: [] } };
