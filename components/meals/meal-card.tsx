import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { itemCountLabel } from "@/lib/meals/helpers";

import MacroLine from "@/components/meals/macro-line";
import VisibilityBadge from "@/components/meals/visibility-badge";

import type { MealSummary } from "@/lib/meals/types";

type MealCardProps = {
  meal: MealSummary;
  /** Shown on public meals of other users instead of the visibility badge. */
  ownerName?: string;
};

export default function MealCard({ meal, ownerName }: MealCardProps) {
  return (
    <li>
      <Link
        href={`/meals/${meal.id}`}
        className="flex items-center gap-3 rounded-2xl border border-foreground/10 p-4 transition-colors hover:bg-foreground/5"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-medium">{meal.name}</h2>
            {ownerName ? null : <VisibilityBadge visibility={meal.visibility} />}
          </div>
          <p className="text-sm text-foreground/60">
            {ownerName ? `מאת ${ownerName} · ` : ""}
            {itemCountLabel(meal.itemCount)}
          </p>
          <MacroLine nutrients={meal.totals.values} />
        </div>
        <ChevronLeft aria-hidden className="size-4 shrink-0 text-foreground/40" />
      </Link>
    </li>
  );
}
