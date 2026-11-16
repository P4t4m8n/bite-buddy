import { redirect } from "next/navigation";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { dateKeyInZone, isDateKey } from "@/lib/diary/dates";
import { parseMealTypeParam } from "@/lib/diary/links";
import { parseMealQuery } from "@/lib/meals/helpers";
import { listMyMeals } from "@/lib/meals/queries";
import { getUserSettings } from "@/lib/user/settings";

import BackButton from "@/components/back-button";
import AddToDiary from "@/components/diary/add-to-diary";
import MealListSkeleton from "@/components/skeletons/meal-list-skeleton";

import type { Metadata } from "next";
import AddToDiary from "@/components/diary/add-to-diary";

export const metadata: Metadata = { title: "הוספה ליומן" };

export default function AddToDiaryPage({ searchParams }: PageProps<"/diary/add">) {
  return (
    <>
      <div className="mb-4">
        <BackButton fallbackHref="/" />
      </div>
      <Suspense fallback={<MealListSkeleton />}>
        <AddToDiaryLoader searchParams={searchParams} />
      </Suspense>
    </>
  );
}

// smart: the day and meal type come from ?date=&meal=, set by the diary's "הוספה" links.
const AddToDiaryLoader = async ({
  searchParams,
}: Pick<PageProps<"/diary/add">, "searchParams">) => {
  const params = await searchParams;
  const mealType = parseMealTypeParam(params.meal);
  if (!mealType) redirect("/");

  const user = await requireUser();
  const query = parseMealQuery(params.q);
  const [settings, meals] = await Promise.all([
    getUserSettings(user.id),
    listMyMeals(user.id, query),
  ]);
  const today = dateKeyInZone(new Date(), settings.timezone);
  const date = isDateKey(params.date) ? params.date : today;

  return <AddToDiary mealType={mealType} date={date} today={today} meals={meals} query={query} />;
};
