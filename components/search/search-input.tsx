"use client";

import { LoaderCircle, Search, X } from "lucide-react";

import { useSearchInput } from "@/lib/hooks/use-search-input";

type SearchInputProps = { label?: string };

export default function SearchInput({ label = "חיפוש מוצר או מותג" }: SearchInputProps) {
  const { value, setValue, clear, isPending } = useSearchInput();

  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40"
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
      <span className="absolute inset-e-3 top-1/2 -translate-y-1/2">
        {isPending ? (
          <LoaderCircle aria-label="מחפש" className="size-4 animate-spin text-foreground/40" />
        ) : value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="ניקוי החיפוש"
            className="flex text-foreground/40 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}
