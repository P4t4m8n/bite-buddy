import Link from "next/link";

import MealCard from "@/components/meals/meal-card";

import type { PublicMealsPage } from "@/lib/meals/types";

const pageHref = (page: number) => (page > 1 ? `/meals/public?page=${page}` : "/meals/public");

export default function PublicMealsList({ items, page, hasMore }: PublicMealsPage) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-foreground/60">
        {page > 1 ? "אין עוד ארוחות ציבוריות." : "עוד אין ארוחות ציבוריות של משתמשים אחרים."}
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
