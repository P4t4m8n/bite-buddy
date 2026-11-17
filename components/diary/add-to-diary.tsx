import { ScanBarcode, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { dayLabel } from "@/lib/diary/dates";
import { MEAL_TYPE_LABELS } from "@/lib/diary/schemas";

import AddMealList from "@/components/diary/add-meal-list";
import PageHeader from "@/components/page-header";
import SearchInput from "@/components/search/search-input";
import SearchInputSkeleton from "@/components/skeletons/search-input-skeleton";

import type { MealType } from "@/generated/prisma/enums";
import type { DateKey } from "@/lib/diary/dates";
import type { MealSummary } from "@/lib/meals/types";

type AddToDiaryProps = {
  mealType: MealType;
  date: DateKey;
  today: DateKey;
  meals: MealSummary[];
  query: string;
};

export default function AddToDiary({ mealType, date, today, meals, query }: AddToDiaryProps) {
  return (
    <>
      <PageHeader
        title={`הוספה ל${MEAL_TYPE_LABELS[mealType]}`}
        description={dayLabel(date, today)}
      />

      <div className="mb-6 grid grid-cols-2 gap-2">
        <Link href="/search" className={quickLinkClass}>
          <Search aria-hidden className="size-4" />
          חיפוש מוצר
        </Link>
        <Link href="/scan" className={quickLinkClass}>
          <ScanBarcode aria-hidden className="size-4" />
          סריקת ברקוד
        </Link>
      </div>

      <section aria-labelledby="my-meals-heading" className="space-y-3">
        <h2 id="my-meals-heading" className="font-semibold">
          הארוחות שלי
        </h2>
        {/* The input reads the URL, so it renders on the client behind a boundary. */}
        <Suspense fallback={<SearchInputSkeleton />}>
          <SearchInput label="חיפוש ארוחה" />
        </Suspense>
        <AddMealList meals={meals} date={date} mealType={mealType} query={query} />
      </section>
    </>
  );
}

const quickLinkClass =
  "flex h-11 items-center justify-center gap-2 rounded-xl border border-foreground/15 text-sm font-medium hover:bg-foreground/5";
