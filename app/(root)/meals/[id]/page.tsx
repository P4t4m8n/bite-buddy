import { notFound } from "next/navigation";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { getVisibleMeal } from "@/lib/meals/queries";

import BackButton from "@/components/back-button";
import MealEditor from "@/components/meals/meal-editor";
import MealView from "@/components/meals/meal-view";
import MealEditorSkeleton from "@/components/skeletons/mealEditorSkeleton";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "ארוחה" };

export default function MealPage({ params }: PageProps<"/meals/[id]">) {
  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/meals" />
      </div>
      <Suspense fallback={<MealEditorSkeleton />}>
        <MealLoader params={params} />
      </Suspense>
    </>
  );
}

// The owner gets the editor; anyone else sees a public meal read-only (private ones are not found).
const MealLoader = async ({ params }: Pick<PageProps<"/meals/[id]">, "params">) => {
  const { id } = await params;
  const user = await requireUser();
  const meal = await getVisibleMeal(id, user.id);
  if (!meal) notFound();
  // Keyed so a different meal (e.g. a fresh copy) gets a fresh editor state.
  return meal.isOwner ? <MealEditor key={meal.id} meal={meal} /> : <MealView meal={meal} />;
};
