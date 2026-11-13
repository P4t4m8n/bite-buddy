"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const DEBOUNCE_MS = 300;

type SearchInputProps = { label?: string };

export const SearchInput = ({ label = "חיפוש מוצר או מותג" }: SearchInputProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlQuery);
  const [isPending, startTransition] = useTransition();

  // Push the typed query into the URL (?q=) after a short pause; the server renders the results.
  useEffect(() => {
    const query = value.trim();
    if (query === urlQuery) return;
    const timer = setTimeout(() => {
      const href = query ? `${pathname}?${new URLSearchParams({ q: query })}` : pathname;
      startTransition(() => router.replace(href, { scroll: false }));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, urlQuery, pathname, router]);

  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40"
      />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={label}
        aria-label={label}
        autoComplete="off"
        enterKeyHint="search"
        className="h-12 w-full rounded-xl border border-foreground/15 bg-background ps-9 pe-10 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="absolute end-3 top-1/2 -translate-y-1/2">
        {isPending ? (
          <LoaderCircle aria-label="מחפש" className="size-4 animate-spin text-foreground/40" />
        ) : value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label="ניקוי החיפוש"
            className="flex text-foreground/40 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
};
