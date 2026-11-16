const WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export const weekdayLabel = (date: string) => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

export const shortDate = (date: string) =>
  `${Number(date.slice(8, 10))}.${Number(date.slice(5, 7))}`;

export const CHART_COLORS = {
  kcal: "#16a34a",
  protein: "#0ea5e9",
  carbs: "#fbbf24",
  fat: "#f43f5e",
};

// Animations are off so charts render the same every time (also in screenshot tests).
export const chartProps = { isAnimationActive: false } as const;
