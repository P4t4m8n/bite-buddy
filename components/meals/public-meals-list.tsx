import Link from "next/link";

import { publicMealsHref } from "@/lib/meals/helpers";

import MealCard from "@/components/meals/meal-card";

import type { PublicMealsPage } from "@/lib/meals/types";

type PublicMealsListProps = PublicMealsPage & { query?: string };

export default function PublicMealsList({
  items,
  page,
  hasMore,
  query = "",
}: PublicMealsListProps) {
  const pageHref = (target: number) => publicMealsHref(target, query);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-foreground/60">
        {page > 1
          ? "אין עוד ארוחות ציבוריות."
          : query
            ? `לא נמצאו ארוחות ציבוריות עבור ״${query}״.`
            : "עוד אין ארוחות ציבוריות של משתמשים אחרים."}
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {items.map((meal) => (
          <MealCard key={meal.id} meal={meal} ownerName={meal.ownerName} />
        ))}
      </ul>
      {page > 1 || hasMore ? (
        <nav aria-label="עמודים" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="font-medium text-brand">
              → הקודם
            </Link>
          ) : (
            <span />
          )}
          <span className="text-foreground/60">עמוד {page}</span>
          {hasMore ? (
            <Link href={pageHref(page + 1)} className="font-medium text-brand">
              הבא ←
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
