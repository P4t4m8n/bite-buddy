import { WifiOff } from "lucide-react";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "אין חיבור" };

/** Shown by the service worker when a page isn't cached and there's no network. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <WifiOff aria-hidden className="size-10 text-foreground/60" />
      <h1 className="mt-4 text-xl font-semibold">אין חיבור לאינטרנט</h1>
      <p className="mt-2 text-sm text-foreground/60">
        הדף הזה עוד לא נשמר במכשיר. דפים שכבר פתחתם זמינים גם בלי חיבור. נסו שוב כשהחיבור יחזור.
      </p>
      {/* A plain link so the browser makes a real request when the network is back. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="mt-6 font-medium text-brand">
        ניסיון חוזר
      </a>
    </main>
  );
}
