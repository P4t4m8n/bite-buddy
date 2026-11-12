import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { parsePageParam } from "@/lib/meals/helpers";
import { listPublicMeals } from "@/lib/meals/queries";

import BackButton from "@/components/back-button";
import { PageHeader } from "@/components/page-header";
import PublicMealsList from "@/components/meals/public-meals-list";
import MealListSkeleton from "@/components/skeletons/mealListSkeleton";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "ארוחות ציבוריות" };

export default function PublicMealsPage({ searchParams }: PageProps<"/meals/public">) {
  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/meals" />
      </div>
      <PageHeader
        title="ארוחות ציבוריות"
        description="ארוחות שמשתמשים אחרים שיתפו. אפשר לשמור עותק ולערוך אותו."
      />
      <Suspense fallback={<MealListSkeleton />}>
        <PublicMealsLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const PublicMealsLoader = async ({
  searchParams,
}: Pick<PageProps<"/meals/public">, "searchParams">) => {
  const page = parsePageParam((await searchParams).page);
  const user = await requireUser();
  return <PublicMealsList {...await listPublicMeals(user.id, page)} />;
};
