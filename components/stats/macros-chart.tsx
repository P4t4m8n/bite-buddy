"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_COLORS, chartProps, weekdayLabel } from "@/lib/stats/chart-format";

import type { DayStats } from "@/lib/stats/aggregate";

export default function MacrosChart({ days }: { days: DayStats[] }) {
  return (
    <div dir="ltr" className="h-56 w-full" aria-label="מאקרו לפי יום (גרם)" role="img">
      <ResponsiveContainer>
        <BarChart
          data={days.map((d) => ({
            label: weekdayLabel(d.date),
            protein: Math.round(d.protein),
            carbs: Math.round(d.carbs),
            fat: Math.round(d.fat),
          }))}
        >
          <CartesianGrid vertical={false} strokeOpacity={0.2} />
          <XAxis dataKey="label" reversed tickLine={false} />
          <YAxis orientation="right" width={40} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value, name) => [`${value} ג׳`, name]} />
          <Legend />
          <Bar
            dataKey="protein"
            name="חלבון"
            stackId="m"
            fill={CHART_COLORS.protein}
            {...chartProps}
          />
          <Bar
            dataKey="carbs"
            name="פחמימות"
            stackId="m"
            fill={CHART_COLORS.carbs}
            {...chartProps}
          />
          <Bar
            dataKey="fat"
            name="שומן"
            stackId="m"
            fill={CHART_COLORS.fat}
            radius={[6, 6, 0, 0]}
            {...chartProps}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
