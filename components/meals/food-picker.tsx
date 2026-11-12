import { LoaderCircle, Plus, ScanBarcode, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MIN_QUERY_LENGTH } from "@/lib/food/search-params";
import { roundNutrient, UNIT_LABELS } from "@/lib/nutrition/format";

import { FoodImage } from "@/components/food/food-image";

import type { FoodSearchPage, FoodSearchResult } from "@/lib/food/search";

const DEBOUNCE_MS = 300;

type SearchState = { query: string; items: FoodSearchResult[]; failed: boolean };

type FoodPickerProps = {
  onAdd: (food: FoodSearchResult) => void;
  /** Scanning leaves the page, so the link is only offered when nothing would be lost. */
  showScanLink: boolean;
};

/** Debounced food search (GET /api/foods) with an "add" button per result. */
export default function FoodPicker({ onAdd, showScanLink }: FoodPickerProps) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState | null>(null);

  const q = query.trim();
  const active = q.length >= MIN_QUERY_LENGTH;
  const current = active && search?.query === q ? search : null;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/foods?${new URLSearchParams({ q })}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Food search failed: ${response.status}`);
        const page = (await response.json()) as FoodSearchPage;
        setSearch({ query: q, items: page.items, failed: false });
      } catch {
        if (!controller.signal.aborted) setSearch({ query: q, items: [], failed: true });
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, active]);

  const add = (food: FoodSearchResult) => {
    onAdd(food);
    setQuery("");
  };

  return (
    <section aria-labelledby="food-picker-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="food-picker-heading" className="font-semibold">
          הוספת מוצר
        </h2>
        {showScanLink ? (
          <Link href="/scan" className="flex items-center gap-1 text-sm font-medium text-brand">
            <ScanBarcode aria-hidden className="size-4" />
            סריקה
          </Link>
        ) : null}
      </div>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          // Enter would submit the meal form.
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder="חיפוש מוצר להוספה"
          aria-label="חיפוש מוצר להוספה"
          autoComplete="off"
          enterKeyHint="search"
          className="h-12 w-full rounded-xl border border-foreground/15 bg-background ps-9 pe-10 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {active && !current ? (
          <LoaderCircle
            aria-label="מחפש"
            className="absolute end-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-foreground/40"
          />
        ) : null}
      </div>

      {current ? <Results search={current} onAdd={add} /> : null}
    </section>
  );
}

const Results = ({
  search,
  onAdd,
}: {
  search: SearchState;
  onAdd: (food: FoodSearchResult) => void;
}) => {
  if (search.failed) {
    return (
      <p role="alert" className="text-sm text-red-600">
        החיפוש נכשל. נסו שוב.
      </p>
    );
  }
  if (search.items.length === 0) {
    return <p className="text-sm text-foreground/60">לא נמצאו מוצרים עבור ״{search.query}״.</p>;
  }
  return (
    <ul aria-label="תוצאות חיפוש" className="-mx-2 max-h-80 overflow-y-auto">
      {search.items.map((food) => (
        <li key={food.id}>
          <button
            type="button"
            onClick={() => onAdd(food)}
            aria-label={`הוספת ${food.name}`}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-start transition-colors hover:bg-foreground/5"
          >
            <FoodImage src={food.imageUrl} name={food.name} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{food.name}</span>
              <span className="block truncate text-xs text-foreground/60">
                {roundNutrient("kcal", food.kcal100)} קק״ל ל־100 {UNIT_LABELS[food.unit]}
                {food.brands.length > 0 ? ` · ${food.brands.join(", ")}` : ""}
              </span>
            </span>
            <Plus aria-hidden className="size-5 shrink-0 text-brand" />
          </button>
        </li>
      ))}
    </ul>
  );
};
