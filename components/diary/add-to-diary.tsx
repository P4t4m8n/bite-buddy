import { ScanBarcode, Search } from "lucide-react";
import { Suspense } from "react";

import { dayLabel } from "@/lib/diary/dates";
import { MEAL_TYPE_LABELS } from "@/lib/diary/schemas";

import AddMealList from "@/components/diary/add-meal-list";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search/search-input";
import QuickLink from "../quick-link";
import { MealType } from "@/generated/prisma/client";
import { MealSummary } from "@/lib/meals/types";

type AddToDiaryProps = {
  date: string;
  today: string;
  mealType: MealType ;
  meals: MealSummary[];
  query: string;
};
export default function AddToDiary({ date, today, mealType, meals, query }: AddToDiaryProps) {
  return (
    <>
      <PageHeader
        title={`הוספה ל${MEAL_TYPE_LABELS[mealType]}`}
        description={dayLabel(date, today)}
      />

      <div className="mb-6 grid grid-cols-2 gap-2">
        <QuickLink href="/search" icon={<Search aria-hidden className="size-4" />}>
          חיפוש מוצר
        </QuickLink>
        <QuickLink href="/scan" icon={<ScanBarcode aria-hidden className="size-4" />}>
          סריקת ברקוד
        </QuickLink>
      </div>

      <section aria-labelledby="my-meals-heading" className="space-y-3">
        <h2 id="my-meals-heading" className="font-semibold">
          הארוחות שלי
        </h2>
        <Suspense fallback={<div className="h-12 rounded-xl border border-foreground/15" />}>
          <SearchInput label="חיפוש ארוחה" />
        </Suspense>
        <AddMealList meals={meals} date={date} mealType={mealType} query={query} />
      </section>
    </>
  );
}
