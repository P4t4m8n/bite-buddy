import { formatPercent } from "@/lib/nutrition/format";
import { macroSplit } from "@/lib/nutrition/nutrients";
import type { Nutrients } from "@/lib/nutrition/types";

const MACROS = [
  { key: "protein", label: "חלבון", color: "bg-sky-500" },
  { key: "carbs", label: "פחמימות", color: "bg-amber-400" },
  { key: "fat", label: "שומן", color: "bg-rose-500" },
] as const;

export const MacroSplitBar = ({ nutrients }: { nutrients: Nutrients }) => {
  const split = macroSplit(nutrients);
  if (!split) return null;

  return (
    <div>
      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-foreground/10"
        role="img"
        aria-label={MACROS.map((m) => `${m.label} ${formatPercent(split[m.key])}`).join(", ")}
      >
        {MACROS.map((m) => (
          <span key={m.key} className={m.color} style={{ width: `${split[m.key]}%` }} />
        ))}
      </div>
      <ul className="mt-2 flex justify-between text-xs text-foreground/70">
        {MACROS.map((m) => (
          <li key={m.key} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2 rounded-full ${m.color}`} />
            {m.label} {formatPercent(split[m.key])}
          </li>
        ))}
      </ul>
    </div>
  );
};
