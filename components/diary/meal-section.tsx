import { Plus } from "lucide-react";
import Link from "next/link";

import { MEAL_TYPE_LABELS } from "@/lib/diary/schemas";
import { roundNutrient } from "@/lib/nutrition/format";

import LogEntryRow from "@/components/diary/log-entry-row";

import type { DiarySection } from "@/lib/diary/types";

export default function MealSection({ section }: { section: DiarySection }) {
  const label = MEAL_TYPE_LABELS[section.mealType];
  const headingId = `section-${section.mealType}`;
  const kcal = section.totals.values.kcal;

  return (
    <section aria-labelledby={headingId} className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 id={headingId} className="font-semibold">
          {label}
        </h2>
        {section.entries.length > 0 && kcal !== null ? (
          <span className="text-sm text-foreground/60 tabular-nums">
            {roundNutrient("kcal", kcal)} קק״ל
          </span>
        ) : null}
      </div>

      {section.entries.length === 0 ? (
        <p className="text-sm text-foreground/60">עוד לא נרשם כלום.</p>
      ) : (
        <ul className="space-y-2">
          {section.entries.map((entry) => (
            <LogEntryRow key={entry.id} entry={entry} />
          ))}
        </ul>
      )}

      <Link
        href="/search"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand"
        aria-label={`הוספה ל${label}`}
      >
        <Plus aria-hidden className="size-4" />
        הוספה
      </Link>
    </section>
  );
}
