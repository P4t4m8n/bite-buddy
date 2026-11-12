import { Suspense } from "react";

import { requireUser } from "@/lib/auth/current-user";
import { getDiaryDay } from "@/lib/diary/queries";

import DailySummary from "@/components/diary/daily-summary";
import DayNavigator from "@/components/diary/day-navigator";
import MealSection from "@/components/diary/meal-section";
import TimezoneSync from "@/components/diary/timezone-sync";
import DiarySkeleton from "@/components/skeletons/diarySkeleton";

export default function Homepage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<DiarySkeleton />}>
      <DiaryLoader searchParams={searchParams} />
    </Suspense>
  );
}

// smart: reads the day from ?date= (defaults to today in the user's time zone)
const DiaryLoader = async ({ searchParams }: Pick<PageProps<"/">, "searchParams">) => {
  const { date } = await searchParams;
  const user = await requireUser();
  const day = await getDiaryDay(user.id, typeof date === "string" ? date : undefined);

  return (
    <>
      <TimezoneSync stored={day.timezone} />
      <DayNavigator date={day.date} today={day.today} />
      <div className="space-y-6">
        <DailySummary totals={day.totals} goals={day.goals} />
        {day.sections.map((section) => (
          <MealSection key={section.mealType} section={section} />
        ))}
      </div>
    </>
  );
};
