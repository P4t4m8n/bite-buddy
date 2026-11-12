import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";

import MealCard from "@/components/meals/meal-card";

import type { MealSummary } from "@/lib/meals/types";

export default function MyMealsList({ meals }: { meals: MealSummary[] }) {
  if (meals.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-foreground/15 px-6 py-10 text-center">
        <UtensilsCrossed aria-hidden className="size-8 text-foreground/30" />
        <p className="mt-3 font-medium">עוד אין לכם ארוחות</p>
        <p className="mt-1 text-sm text-foreground/60">
          בונים ארוחה פעם אחת, ורואים מיד את הקלוריות והמאקרו שלה.
        </p>
        <Link href="/meals/new" className="mt-4 font-medium text-brand">
          יצירת ארוחה ראשונה
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} />
      ))}
    </ul>
  );
}
