import { publicMealsHref } from "@/lib/meals/helpers";

import Hint from "@/components/hint";
import MealCard from "@/components/meals/meal-card";
import Pagination from "@/components/pagination";

import type { PublicMealsPage } from "@/lib/meals/types";

type PublicMealsListProps = PublicMealsPage & { query?: string };

export default function PublicMealsList({
  items,
  page,
  hasMore,
  query = "",
}: PublicMealsListProps) {
  if (items.length === 0) {
    return (
      <Hint>
        {page > 1
          ? "אין עוד ארוחות ציבוריות."
          : query
            ? `לא נמצאו ארוחות ציבוריות עבור ״${query}״.`
            : "עוד אין ארוחות ציבוריות של משתמשים אחרים."}
      </Hint>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {items.map((meal) => (
          <MealCard key={meal.id} meal={meal} ownerName={meal.ownerName} />
        ))}
      </ul>
      <Pagination
        page={page}
        hasMore={hasMore}
        hrefFor={(target) => publicMealsHref(target, query)}
      />
    </>
  );
}
