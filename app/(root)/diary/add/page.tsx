import { ScanBarcode, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { dateKeyInZone, dayLabel, isDateKey } from "@/lib/diary/dates";
import { parseMealTypeParam } from "@/lib/diary/links";
import { MEAL_TYPE_LABELS } from "@/lib/diary/schemas";
import { parseMealQuery } from "@/lib/meals/helpers";
import { listMyMeals } from "@/lib/meals/queries";
import { getUserSettings } from "@/lib/user/settings";

import BackButton from "@/components/back-button";
import AddMealList from "@/components/diary/add-meal-list";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search/search-input";
import MealListSkeleton from "@/components/skeletons/mealListSkeleton";

import type { Metadata } from "next";

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

  return (
    <>
      <PageHeader
        title={`הוספה ל${MEAL_TYPE_LABELS[mealType]}`}
        description={dayLabel(date, today)}
      />

      <div className="mb-6 grid grid-cols-2 gap-2">
        <QuickLink href="/search" icon={<Search aria-hidden className="size-4" />}>
          חיפוש מוצר
        </QuickLink>
        <QuickLink href="/scan" icon={<ScanBarcode aria-hidden className="size-4" />}>
          סריקת ברקוד
        </QuickLink>
      </div>

      <section aria-labelledby="my-meals-heading" className="space-y-3">
        <h2 id="my-meals-heading" className="font-semibold">
          הארוחות שלי
        </h2>
        <Suspense fallback={<div className="h-12 rounded-xl border border-foreground/15" />}>
          <SearchInput label="חיפוש ארוחה" />
        </Suspense>
        <AddMealList meals={meals} date={date} mealType={mealType} query={query} />
      </section>
    </>
  );
};

const QuickLink = ({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-foreground/15 text-sm font-medium hover:bg-foreground/5"
  >
    {icon}
    {children}
  </Link>
);
