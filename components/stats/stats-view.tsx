import { ChevronLeft, ChevronRight, Flame, Target } from "lucide-react";
import Link from "next/link";

import { addDays } from "@/lib/diary/dates";
import { roundNutrient } from "@/lib/nutrition/format";

import { CaloriesChart, MacrosChart, TrendChart } from "@/components/stats/charts";

import type { WeeklyStats } from "@/lib/stats/queries";

const formatDay = (date: string) => `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;

const ROWS = [
  { key: "kcal", goal: "kcal", label: "קלוריות", unit: "קק״ל" },
  { key: "protein", goal: "proteinG", label: "חלבון", unit: "ג׳" },
  { key: "carbs", goal: "carbsG", label: "פחמימות", unit: "ג׳" },
  { key: "fat", goal: "fatG", label: "שומן", unit: "ג׳" },
] as const;

export default function StatsView({ stats }: { stats: WeeklyStats }) {
  const { summary, goals } = stats;

  return (
    <div className="space-y-8">
      <nav aria-label="בחירת שבוע" className="flex items-center justify-between gap-2">
        <Link
          href={`/stats?week=${addDays(stats.weekStart, -7)}`}
          aria-label="השבוע הקודם"
          className="flex size-10 items-center justify-center rounded-full hover:bg-foreground/5"
        >
          <ChevronRight aria-hidden className="size-5" />
        </Link>
        <div className="text-center">
          <h2 className="font-semibold">{stats.isCurrentWeek ? "השבוע" : "שבוע"}</h2>
          <p className="text-sm text-foreground/60 tabular-nums">
            {formatDay(stats.weekStart)}–{formatDay(stats.weekEnd)}
          </p>
        </div>
        {stats.isCurrentWeek ? (
          <span className="size-10" />
        ) : (
          <Link
            href={`/stats?week=${addDays(stats.weekStart, 7)}`}
            aria-label="השבוע הבא"
            className="flex size-10 items-center justify-center rounded-full hover:bg-foreground/5"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Link>
        )}
      </nav>

      <section aria-labelledby="week-summary-heading" className="space-y-3">
        <h2 id="week-summary-heading" className="font-semibold">
          סיכום שבועי
        </h2>
        <p className="text-sm text-foreground/60">
          {summary.loggedDays === 0
            ? "עוד לא נרשם כלום השבוע."
            : `ממוצע יומי לפי ${summary.loggedDays} ימים עם רישום.`}
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-foreground/10 text-xs text-foreground/60">
              <th className="py-2 text-start font-medium">רכיב</th>
              <th className="py-2 text-end font-medium">סה״כ</th>
              <th className="py-2 text-end font-medium">ממוצע ליום</th>
              {goals ? <th className="py-2 text-end font-medium">יעד יומי</th> : null}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key} className="border-b border-foreground/5 last:border-0">
                <th scope="row" className="py-2 text-start font-medium">
                  {row.label} <span className="font-normal text-foreground/60">({row.unit})</span>
                </th>
                <td className="py-2 text-end tabular-nums">
                  {roundNutrient(row.key, summary.totals[row.key])}
                </td>
                <td className="py-2 text-end font-medium tabular-nums">
                  {roundNutrient(row.key, summary.averages[row.key])}
                </td>
                {goals ? (
                  <td className="py-2 text-end text-foreground/60 tabular-nums">
                    {goals[row.goal]}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {goals ? null : (
          <p className="text-sm text-foreground/60">
            <Link href="/settings" className="font-medium text-brand">
              הגדרת יעדים
            </Link>{" "}
            כדי להשוות ליעד.
          </p>
        )}
      </section>

      <section aria-labelledby="kcal-chart-heading" className="space-y-2">
        <h2 id="kcal-chart-heading" className="font-semibold">
          קלוריות לפי יום
        </h2>
        <CaloriesChart days={stats.days} goal={goals?.kcal ?? null} />
      </section>

      <section aria-labelledby="macros-chart-heading" className="space-y-2">
        <h2 id="macros-chart-heading" className="font-semibold">
          מאקרו לפי יום
        </h2>
        <MacrosChart days={stats.days} />
      </section>

      <section aria-labelledby="insights-heading" className="space-y-3">
        <h2 id="insights-heading" className="font-semibold">
          תובנות
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-foreground/[0.03] p-3">
            <Flame aria-hidden className="size-5 text-orange-500" />
            <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.streak}</p>
            <p className="text-sm text-foreground/60">ימי רישום ברצף</p>
          </div>
          <div className="rounded-2xl bg-foreground/[0.03] p-3">
            <Target aria-hidden className="size-5 text-brand" />
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {stats.onTargetDays === null ? "–" : `${stats.onTargetDays}/7`}
            </p>
            <p className="text-sm text-foreground/60">ימים ביעד הקלוריות (±10%)</p>
          </div>
        </div>
        {stats.topFoods.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium">הכי הרבה קלוריות השבוע</h3>
            <ol className="mt-2 space-y-1">
              {stats.topFoods.map((food, index) => (
                <li key={food.name} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">
                    {index + 1}. {food.name}
                    {food.count > 1 ? (
                      <span className="text-foreground/60"> ×{food.count}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {roundNutrient("kcal", food.kcal)} קק״ל
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="trend-heading" className="space-y-2">
        <h2 id="trend-heading" className="font-semibold">
          מגמה: ממוצע קלוריות ב־8 שבועות
        </h2>
        <TrendChart trend={stats.trend} goal={goals?.kcal ?? null} />
      </section>
    </div>
  );
}
