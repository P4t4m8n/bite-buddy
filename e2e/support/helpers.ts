import type { Page } from "@playwright/test";

/**
 * Open Food Facts images are slow and change over time. Blocking them makes the
 * FoodImage placeholder render instead, so tests and screenshots are deterministic.
 */
export const blockProductImages = (page: Page) =>
  page.route("https://images.openfoodfacts.org/**", (route) => route.abort());

export const signedOut = { storageState: { cookies: [], origins: [] } };

/**
 * Headless browsers have no camera, and what getUserMedia does without one differs
 * between environments. Denying it makes the scanner's fallback state deterministic.
 */
export const denyCamera = (page: Page) =>
  page.addInitScript(() => {
    if (!navigator.mediaDevices) return;
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
  });
