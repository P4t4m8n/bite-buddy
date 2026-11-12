import Link from "next/link";

import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <SearchX aria-hidden className="size-10 text-foreground/40" />
      <h1 className="mt-4 text-xl font-semibold">הדף לא נמצא</h1>
      <p className="mt-2 text-sm text-foreground/60">ייתכן שהקישור שגוי או שהפריט נמחק.</p>
      <Link href="/" className="mt-6 font-medium text-brand">
        חזרה לדף הבית
      </Link>
    </main>
  );
}
