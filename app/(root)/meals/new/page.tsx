import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";

import BackButton from "@/components/back-button";
import MealEditor from "@/components/meals/meal-editor";
import MealEditorSkeleton from "@/components/skeletons/mealEditorSkeleton";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "ארוחה חדשה" };

export default function NewMealPage() {
  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/meals" />
      </div>
      <Suspense fallback={<MealEditorSkeleton />}>
        <NewMealLoader />
      </Suspense>
    </>
  );
}

// Checks the session before showing the editor, so an expired session redirects to sign-in.
const NewMealLoader = async () => {
  await requireUser();
  return <MealEditor />;
};
