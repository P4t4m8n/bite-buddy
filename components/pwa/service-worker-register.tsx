"use client";

import { useEffect } from "react";

/** Registers the service worker in production builds (in dev it would cache stale code). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Without a service worker the app still works, just not offline.
    });
  }, []);

  return null;
}

/** Asks the service worker to drop cached pages and searches (call on sign-out). */
export const clearUserCache = async () => {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.active?.postMessage("clear-user-cache");
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => !key.startsWith("bitebuddy-static")).map((key) => caches.delete(key)),
    );
  }
};
