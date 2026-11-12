"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DayStats, WeekTrendPoint } from "@/lib/stats/aggregate";

const WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

const weekdayLabel = (date: string) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];
const shortDate = (date: string) => `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;

const COLORS = { kcal: "#16a34a", protein: "#0ea5e9", carbs: "#fbbf24", fat: "#f43f5e" };

// Animations are off so charts render the same every time (also in screenshot tests).
const chartProps = { isAnimationActive: false } as const;

/** Charts are drawn left to right; `reversed` puts the first day on the right for RTL. */
export const CaloriesChart = ({ days, goal }: { days: DayStats[]; goal: number | null }) => (
  <div dir="ltr" className="h-56 w-full" aria-label="קלוריות לפי יום" role="img">
    <ResponsiveContainer>
      <BarChart
        data={days.map((d) => ({ ...d, label: weekdayLabel(d.date), kcal: Math.round(d.kcal) }))}
      >
        <CartesianGrid vertical={false} strokeOpacity={0.2} />
        <XAxis dataKey="label" reversed tickLine={false} />
        <YAxis orientation="right" width={40} tickLine={false} axisLine={false} />
        <Tooltip formatter={(value) => [`${value} קק״ל`, "קלוריות"]} />
        <Bar dataKey="kcal" fill={COLORS.kcal} radius={[6, 6, 0, 0]} {...chartProps} />
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

export const MacrosChart = ({ days }: { days: DayStats[] }) => (
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
        <Bar dataKey="protein" name="חלבון" stackId="m" fill={COLORS.protein} {...chartProps} />
        <Bar dataKey="carbs" name="פחמימות" stackId="m" fill={COLORS.carbs} {...chartProps} />
        <Bar
          dataKey="fat"
          name="שומן"
          stackId="m"
          fill={COLORS.fat}
          radius={[6, 6, 0, 0]}
          {...chartProps}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const TrendChart = ({ trend, goal }: { trend: WeekTrendPoint[]; goal: number | null }) => (
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
          stroke={COLORS.kcal}
          strokeWidth={2}
          dot={{ r: 3 }}
          connectNulls
          {...chartProps}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);
