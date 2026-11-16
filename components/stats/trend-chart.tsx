"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS, chartProps, shortDate } from "@/lib/stats/chart-format";

import type { WeekTrendPoint } from "@/lib/stats/aggregate";

type TrendChartProps = { trend: WeekTrendPoint[]; goal: number | null };

export default function TrendChart({ trend, goal }: TrendChartProps) {
  return (
    <div dir="ltr" className="h-56 w-full" aria-label="ממוצע קלוריות יומי לפי שבוע" role="img">
      <ResponsiveContainer>
        <LineChart
          data={trend.map((w) => ({
            label: shortDate(w.weekStart),
            kcal: w.loggedDays ? Math.round(w.kcal) : null,
          }))}
        >
          <CartesianGrid vertical={false} strokeOpacity={0.2} />
          <XAxis dataKey="label" reversed tickLine={false} />
          <YAxis orientation="right" width={40} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value) => [`${value} קק״ל`, "ממוצע יומי"]} />
          {goal ? <ReferenceLine y={goal} stroke="#64748b" strokeDasharray="4 4" /> : null}
          <Line
            type="monotone"
            dataKey="kcal"
            stroke={CHART_COLORS.kcal}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
            {...chartProps}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
