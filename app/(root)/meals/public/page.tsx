import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { parseMealQuery, parsePageParam } from "@/lib/meals/helpers";
import { listPublicMeals } from "@/lib/meals/queries";

import BackButton from "@/components/back-button";
import { PageHeader } from "@/components/page-header";
import PublicMealsList from "@/components/meals/public-meals-list";
import { SearchInput } from "@/components/search/search-input";
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
      <div className="mb-4">
        {/* The input reads the URL, so it renders on the client behind a boundary. */}
        <Suspense fallback={<div className="h-12 rounded-xl border border-foreground/15" />}>
          <SearchInput label="חיפוש ארוחה ציבורית" />
        </Suspense>
      </div>
      <Suspense fallback={<MealListSkeleton />}>
        <PublicMealsLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const PublicMealsLoader = async ({
  searchParams,
}: Pick<PageProps<"/meals/public">, "searchParams">) => {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const query = parseMealQuery(params.q);
  const user = await requireUser();
  return <PublicMealsList {...await listPublicMeals(user.id, page, query)} query={query} />;
};
