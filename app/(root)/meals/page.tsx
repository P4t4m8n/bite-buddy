import { Globe, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { listMyMeals } from "@/lib/meals/queries";

import MyMealsList from "@/components/meals/my-meals-list";
import { PageHeader } from "@/components/page-header";
import MealListSkeleton from "@/components/skeletons/mealListSkeleton";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "ארוחות" };

export default function MealsPage() {
  return (
    <>
      <PageHeader
        title="ארוחות"
        description="בונים ארוחות ומשתמשים בהן שוב."
        action={
          <Link
            href="/meals/new"
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-white"
          >
            <Plus aria-hidden className="size-4" />
            ארוחה חדשה
          </Link>
        }
      />
      <Link
        href="/meals/public"
        className="mb-4 flex items-center gap-2 rounded-xl bg-foreground/[0.03] p-3 text-sm font-medium hover:bg-foreground/5"
      >
        <Globe aria-hidden className="size-4 text-brand" />
        ארוחות ציבוריות של משתמשים אחרים
      </Link>
      <Suspense fallback={<MealListSkeleton />}>
        <MyMealsLoader />
      </Suspense>
    </>
  );
}

const MyMealsLoader = async () => {
  const user = await requireUser();
  return <MyMealsList meals={await listMyMeals(user.id)} />;
};
