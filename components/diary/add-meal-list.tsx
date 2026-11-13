"use client";

import { LoaderCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { diaryDayHref } from "@/lib/diary/links";
import { itemCountLabel } from "@/lib/meals/helpers";

import MacroLine from "@/components/meals/macro-line";

import type { MealType } from "@/generated/prisma/enums";
import type { DateKey } from "@/lib/diary/dates";
import type { MealSummary } from "@/lib/meals/types";

type AddMealListProps = {
  meals: MealSummary[];
  date: DateKey;
  mealType: MealType;
  query: string;
};

/** The user's meals, each logged as one serving with a tap; servings can be changed in the diary. */
export default function AddMealList({ meals, date, mealType, query }: AddMealListProps) {
  const router = useRouter();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const add = async (mealId: string) => {
    setAddingId(mealId);
    setError(null);
    try {
      const response = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          mealType,
          mealId,
          servings: 1,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      router.push(diaryDayHref(date));
      router.refresh();
    } catch {
      setError("ההוספה נכשלה. נסו שוב.");
      setAddingId(null);
    }
  };

  if (meals.length === 0) {
    return query ? (
      <p className="py-6 text-center text-sm text-foreground/60">לא נמצאו ארוחות עבור ״{query}״.</p>
    ) : (
      <p className="py-6 text-center text-sm text-foreground/60">
        עוד אין לכם ארוחות שמורות.{" "}
        <Link href="/meals/new" className="font-medium text-brand">
          יצירת ארוחה
        </Link>
      </p>
    );
  }

  return (
    <>
      {error ? (
        <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <ul className="space-y-2">
        {meals.map((meal) => (
          <li
            key={meal.id}
            className="flex items-center gap-3 rounded-2xl border border-foreground/10 p-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate font-medium">{meal.name}</p>
              <p className="text-sm text-foreground/60">{itemCountLabel(meal.itemCount)}</p>
              <MacroLine nutrients={meal.totals.values} />
            </div>
            <button
              type="button"
              onClick={() => add(meal.id)}
              disabled={addingId !== null}
              aria-label={`הוספת ${meal.name}`}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground disabled:opacity-50"
            >
              {addingId === meal.id ? (
                <LoaderCircle aria-hidden className="size-5 animate-spin" />
              ) : (
                <Plus aria-hidden className="size-5" />
              )}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
