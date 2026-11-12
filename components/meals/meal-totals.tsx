import { MacroSplitBar } from "@/components/food/macro-split-bar";
import { NUTRIENT_ROWS } from "@/components/food/nutrition-table";
import { formatNutrient, roundNutrient, UNKNOWN } from "@/lib/nutrition/format";

import type { NutrientTotals } from "@/lib/nutrition/types";

type MealTotalsProps = {
  totals: NutrientTotals;
  /** Total weight/volume in g/ml (1 ml counted as 1 g). */
  totalAmount: number;
};

export default function MealTotals({ totals, totalAmount }: MealTotalsProps) {
  const { values, incomplete } = totals;
  const incompleteLabels = NUTRIENT_ROWS.filter(({ key }) => incomplete.includes(key)).map(
    ({ label }) => label,
  );

  return (
    <section
      aria-labelledby="meal-totals-heading"
      className="space-y-4 rounded-2xl bg-foreground/[0.03] p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="meal-totals-heading" className="font-semibold">
          סה״כ לארוחה
        </h2>
        <p className="text-sm text-foreground/60">כמות כוללת: {Math.round(totalAmount)} גרם</p>
      </div>

      <p className="text-3xl font-semibold tabular-nums">
        {values.kcal === null ? UNKNOWN : roundNutrient("kcal", values.kcal)}{" "}
        <span className="text-base font-normal text-foreground/60">קק״ל</span>
      </p>

      <MacroSplitBar nutrients={values} />

      <table className="w-full text-sm">
        <tbody>
          {NUTRIENT_ROWS.map(({ key, label, sub }) => (
            <tr key={key} className="border-b border-foreground/5 last:border-0">
              <th
                scope="row"
                className={`py-1.5 text-start font-normal ${sub ? "ps-4 text-foreground/60" : "font-medium"}`}
              >
                {label}
              </th>
              <td className="py-1.5 text-end font-medium tabular-nums">
                {formatNutrient(key, values[key])}
                {incomplete.includes(key) ? <span aria-hidden> *</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {incompleteLabels.length > 0 ? (
        <p className="text-xs text-foreground/60">
          * ערך חלקי: לחלק מהמוצרים אין מידע על {incompleteLabels.join(", ")}.
        </p>
      ) : null}
    </section>
  );
}
