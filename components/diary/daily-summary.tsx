import Link from "next/link";

import { roundNutrient } from "@/lib/nutrition/format";

import { MacroSplitBar } from "@/components/food/macro-split-bar";

import type { UserGoals } from "@/lib/user/settings";
import type { NutrientTotals } from "@/lib/nutrition/types";

const ROWS = [
  { key: "kcal", goal: "kcal", label: "קלוריות", unit: "קק״ל", color: "bg-brand" },
  { key: "protein", goal: "proteinG", label: "חלבון", unit: "ג׳", color: "bg-sky-500" },
  { key: "carbs", goal: "carbsG", label: "פחמימות", unit: "ג׳", color: "bg-amber-400" },
  { key: "fat", goal: "fatG", label: "שומן", unit: "ג׳", color: "bg-rose-500" },
] as const;

type DailySummaryProps = { totals: NutrientTotals; goals: UserGoals | null };

export default function DailySummary({ totals, goals }: DailySummaryProps) {
  const { values } = totals;

  return (
    <section aria-label="סיכום יומי" className="space-y-4 rounded-2xl bg-foreground/[0.03] p-4">
      <ul className="space-y-3">
        {ROWS.map((row) => {
          const value = values[row.key] ?? 0;
          const goal = goals?.[row.goal] ?? null;
          const percent = goal ? Math.min((value / goal) * 100, 100) : 0;
          const over = goal !== null && value > goal;
          return (
            <li key={row.key}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{row.label}</span>
                <span className="tabular-nums">
                  <span className={`font-semibold ${over ? "text-red-600 dark:text-red-400" : ""}`}>
                    {roundNutrient(row.key, value)}
                  </span>
                  {goal ? <span className="text-foreground/60"> / {goal}</span> : null}{" "}
                  <span className="text-foreground/60">{row.unit}</span>
                </span>
              </div>
              {goal ? (
                <div
                  role="progressbar"
                  aria-label={row.label}
                  aria-valuemin={0}
                  aria-valuemax={goal}
                  aria-valuenow={Math.round(value)}
                  className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/10"
                >
                  <span
                    className={`block h-full rounded-full ${over ? "bg-red-500" : row.color}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <MacroSplitBar nutrients={values} />

      {goals ? null : (
        <p className="text-sm text-foreground/60">
          עוד לא הגדרתם יעדים יומיים.{" "}
          <Link href="/settings" className="font-medium text-brand">
            הגדרת יעדים
          </Link>
        </p>
      )}
    </section>
  );
}
