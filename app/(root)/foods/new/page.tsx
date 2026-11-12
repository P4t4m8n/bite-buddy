import { Suspense } from "react";

import { prefillFromSearchParams } from "@/lib/food/custom-food";

import BackButton from "@/components/back-button";
import CustomFoodForm from "@/components/food/custom-food-form";
import MealEditorSkeleton from "@/components/skeletons/mealEditorSkeleton";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "מוצר חדש" };

export default function NewFoodPage({ searchParams }: PageProps<"/foods/new">) {
  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/search" />
      </div>
      <Suspense fallback={<MealEditorSkeleton />}>
        <NewFoodLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// The URL may carry a prefill from the scan page (barcode, name, nutrients) or the search query.
const NewFoodLoader = async ({ searchParams }: Pick<PageProps<"/foods/new">, "searchParams">) => (
  <CustomFoodForm initialValues={prefillFromSearchParams(await searchParams)} />
);
