import { mealNutrition } from "@/lib/nutrition/nutrients";
import { UNIT_LABELS } from "@/lib/nutrition/format";

import { FoodImage } from "@/components/food/food-image";
import CopyMealButton from "@/components/meals/copy-meal-button";
import LogButton from "@/components/diary/log-button";
import MacroLine from "@/components/meals/macro-line";
import MealTotals from "@/components/meals/meal-totals";

import type { MealDetail } from "@/lib/meals/types";

/** Read-only view of another user's public meal. */
export default function MealView({ meal }: { meal: MealDetail }) {
  const nutrition = mealNutrition(meal.items);

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{meal.name}</h1>
        <p className="mt-1 text-sm text-foreground/60">ארוחה ציבורית מאת {meal.ownerName}</p>
        {meal.notes ? <p className="mt-3 text-sm whitespace-pre-line">{meal.notes}</p> : null}
      </header>

      <CopyMealButton mealId={meal.id} />
      <LogButton
        target={{ kind: "meal", mealId: meal.id, name: meal.name }}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-foreground/15 font-medium disabled:opacity-50"
      />

      <section aria-labelledby="meal-items-heading" className="space-y-3">
        <h2 id="meal-items-heading" className="font-semibold">
          מוצרים בארוחה
        </h2>
        {meal.items.length === 0 ? (
          <p className="text-sm text-foreground/60">אין מוצרים בארוחה הזו.</p>
        ) : (
          <ol className="space-y-2">
            {meal.items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-foreground/10 p-3"
              >
                <FoodImage src={item.food.imageUrl} name={item.food.name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.food.name}</p>
                  <p className="text-sm text-foreground/60">
                    {item.amount} {UNIT_LABELS[item.food.unit]}
                  </p>
                  <MacroLine nutrients={nutrition.items[index]} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <MealTotals totals={nutrition.totals} totalAmount={nutrition.totalAmount} />
    </article>
  );
}
