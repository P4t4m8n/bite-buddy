"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS, chartProps, weekdayLabel } from "@/lib/stats/chart-format";

import type { DayStats } from "@/lib/stats/aggregate";

type CaloriesChartProps = { days: DayStats[]; goal: number | null };

/** Charts are drawn left to right; `reversed` puts the first day on the right for RTL. */
export default function CaloriesChart({ days, goal }: CaloriesChartProps) {
  return (
    <div dir="ltr" className="h-56 w-full" aria-label="קלוריות לפי יום" role="img">
      <ResponsiveContainer>
        <BarChart
          data={days.map((d) => ({ ...d, label: weekdayLabel(d.date), kcal: Math.round(d.kcal) }))}
        >
          <CartesianGrid vertical={false} strokeOpacity={0.2} />
          <XAxis dataKey="label" reversed tickLine={false} />
          <YAxis orientation="right" width={40} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => [`${value} קק״ל`, "קלוריות"]} />
          <Bar dataKey="kcal" fill={CHART_COLORS.kcal} radius={[6, 6, 0, 0]} {...chartProps} />
          {goal ? (
            <ReferenceLine
              y={goal}
              stroke="#64748b"
              strokeDasharray="4 4"
              label={{ value: "יעד", position: "insideTopLeft", fontSize: 12 }}
            />
          ) : null}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
