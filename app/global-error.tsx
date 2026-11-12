"use client";

import "./globals.css";

/** Last-resort error page when the root layout itself fails. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center font-sans">
        <h1 className="text-xl font-semibold">משהו השתבש</h1>
        <p className="text-sm text-foreground/60">האפליקציה נתקלה בשגיאה. נסו לטעון מחדש.</p>
        <button
          type="button"
          onClick={reset}
          className="h-11 rounded-full bg-brand px-5 font-medium text-brand-foreground"
        >
          ניסיון חוזר
        </button>
      </body>
    </html>
  );
}
