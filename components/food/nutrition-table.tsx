import type { FoodUnit } from "@/generated/prisma/enums";
import { formatNutrient, UNIT_LABELS } from "@/lib/nutrition/format";
import type { NutrientKey, Nutrients } from "@/lib/nutrition/types";

export const NUTRIENT_ROWS: { key: NutrientKey; label: string; sub?: boolean }[] = [
  { key: "kcal", label: "קלוריות" },
  { key: "protein", label: "חלבונים" },
  { key: "carbs", label: "פחמימות" },
  { key: "sugar", label: "מתוכן סוכרים", sub: true },
  { key: "fat", label: "שומנים" },
  { key: "satFat", label: "מתוכם שומן רווי", sub: true },
  { key: "fiber", label: "סיבים תזונתיים" },
  { key: "sodium", label: "נתרן" },
];

type NutritionTableProps = {
  per100: Nutrients;
  amount: Nutrients;
  unit: FoodUnit;
  amountLabel: string;
};

export const NutritionTable = ({ per100, amount, unit, amountLabel }: NutritionTableProps) => (
  <table className="w-full text-sm">
    <thead>
      <tr className="border-b border-foreground/10 text-start text-xs text-foreground/60">
        <th className="py-2 text-start font-medium">רכיב</th>
        <th className="py-2 text-end font-medium">ל־100 {UNIT_LABELS[unit]}</th>
        <th className="py-2 text-end font-medium">{amountLabel}</th>
      </tr>
    </thead>
    <tbody>
      {NUTRIENT_ROWS.map(({ key, label, sub }) => (
        <tr key={key} className="border-b border-foreground/5 last:border-0">
          <th
            scope="row"
            className={`py-2 text-start font-normal ${sub ? "ps-4 text-foreground/60" : "font-medium"}`}
          >
            {label}
          </th>
          <td className="py-2 text-end text-foreground/60 tabular-nums">
            {formatNutrient(key, per100[key])}
          </td>
          <td className="py-2 text-end font-medium tabular-nums">
            {formatNutrient(key, amount[key])}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);
