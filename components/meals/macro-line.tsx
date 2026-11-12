import { formatNutrient } from "@/lib/nutrition/format";

import type { Nutrients } from "@/lib/nutrition/types";

type MacroLineProps = {
  nutrients: Pick<Nutrients, "kcal" | "protein" | "carbs" | "fat">;
  className?: string;
};

/** "256 קק״ל · חלבון 21 ג׳ · פחמימות 2.4 ג׳ · שומן 18 ג׳" */
export default function MacroLine({ nutrients, className = "" }: MacroLineProps) {
  return (
    <p className={`text-xs text-foreground/60 tabular-nums ${className}`}>
      <span className="font-medium text-foreground">{formatNutrient("kcal", nutrients.kcal)}</span>
      {" · "}חלבון {formatNutrient("protein", nutrients.protein)}
      {" · "}פחמימות {formatNutrient("carbs", nutrients.carbs)}
      {" · "}שומן {formatNutrient("fat", nutrients.fat)}
    </p>
  );
}
