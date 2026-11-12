"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";

/** Shown when a page in the app throws; the top and bottom bars stay usable. */
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <TriangleAlert aria-hidden className="size-10 text-amber-500" />
      <h1 className="mt-4 text-xl font-semibold">משהו השתבש</h1>
      <p className="mt-2 text-sm text-foreground/60">לא הצלחנו לטעון את הדף. נסו שוב בעוד רגע.</p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-11 items-center gap-2 rounded-full bg-brand px-5 font-medium text-brand-foreground"
        >
          <RotateCcw aria-hidden className="size-4" />
          ניסיון חוזר
        </button>
        <Link
          href="/"
          className="flex h-11 items-center rounded-full border border-foreground/15 px-5 font-medium"
        >
          לדף הבית
        </Link>
      </div>
    </div>
  );
}
