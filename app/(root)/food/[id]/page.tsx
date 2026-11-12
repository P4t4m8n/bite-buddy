import { notFound } from "next/navigation";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { getVisibleFood } from "@/lib/food/search";

import BackButton from "@/components/back-button";
import FoodDetails from "@/components/FoodDetails";
import FoodSkeleton from "@/components/skeletons/foodSkeleton";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "מוצר" };

export default function FoodPage({ params }: PageProps<"/food/[id]">) {
  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/search" />
      </div>
      <Suspense fallback={<FoodSkeleton />}>
        <FoodLoader params={params} />
      </Suspense>
    </>
  );
}

// smart: data only here for suspane boundary, not for rendering UI directly
const FoodLoader = async ({ params }: Pick<PageProps<"/food/[id]">, "params">) => {
  const { id } = await params;
  const user = await requireUser();
  const food = await getVisibleFood(id, user.id);
  if (!food) notFound();
  return <FoodDetails food={food} />;
};
