"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type BackButtonProps = { fallbackHref: string; label?: string };

/**
 * Goes back in history (keeping e.g. the search query), or to `fallbackHref`
 * when the page was opened directly. The arrow points right because the app is RTL.
 */
export default function BackButton({ fallbackHref, label = "חזרה" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="-ms-2 flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
    >
      <ArrowRight aria-hidden className="size-4" />
      {label}
    </button>
  );
}
