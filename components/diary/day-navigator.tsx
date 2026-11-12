import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { addDays, dayLabel } from "@/lib/diary/dates";

import type { DateKey } from "@/lib/diary/dates";

const dayHref = (date: DateKey, today: DateKey) => (date === today ? "/" : `/?date=${date}`);

type DayNavigatorProps = { date: DateKey; today: DateKey };

/** Previous day is on the right and next day on the left, because the app is RTL. */
export default function DayNavigator({ date, today }: DayNavigatorProps) {
  const label = dayLabel(date, today);

  return (
    <nav aria-label="בחירת יום" className="mb-4 flex items-center justify-between gap-2">
      <Link
        href={dayHref(addDays(date, -1), today)}
        aria-label="היום הקודם"
        className="flex size-10 items-center justify-center rounded-full hover:bg-foreground/5"
      >
        <ChevronRight aria-hidden className="size-5" />
      </Link>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{label}</h1>
        {date === today ? null : (
          <Link href="/" className="text-sm font-medium text-brand">
            חזרה להיום
          </Link>
        )}
      </div>
      <Link
        href={dayHref(addDays(date, 1), today)}
        aria-label="היום הבא"
        className="flex size-10 items-center justify-center rounded-full hover:bg-foreground/5"
      >
        <ChevronLeft aria-hidden className="size-5" />
      </Link>
    </nav>
  );
}
