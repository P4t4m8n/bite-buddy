"use client";

import { useState } from "react";

import { MacroSplitBar } from "@/components/food/macro-split-bar";
import { NutritionTable } from "@/components/food/nutrition-table";
import { UNIT_LABELS } from "@/lib/nutrition/format";
import { foodPer100, scale } from "@/lib/nutrition/nutrients";

import type { FoodUnit } from "@/generated/prisma/enums";
import type { FoodNutrition } from "@/lib/nutrition/types";

const MAX_AMOUNT = 5000;
const QUICK_AMOUNTS = [50, 100, 200];

type FoodAmountCalculatorProps = {
  nutrition: FoodNutrition;
  unit: FoodUnit;
  packageAmount: number | null;
};

export default function FoodAmountCalculator({
  nutrition,
  unit,
  packageAmount,
}: FoodAmountCalculatorProps) {
  const [input, setInput] = useState("100");
  const parsed = Number(input);
  const amount = Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, MAX_AMOUNT) : 0;

  const unitLabel = UNIT_LABELS[unit];
  const per100 = foodPer100(nutrition);
  const scaled = scale(per100, amount);
  const quickAmounts = packageAmount ? [...QUICK_AMOUNTS, packageAmount] : QUICK_AMOUNTS;

  return (
    <section aria-labelledby="amount-heading" className="space-y-4">
      <div>
        <label id="amount-heading" htmlFor="amount" className="text-sm font-medium">
          כמות
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            min={0}
            max={MAX_AMOUNT}
            step="any"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="h-11 w-28 rounded-lg border border-foreground/15 bg-background px-3 text-end tabular-nums focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
          />
          <span className="text-sm text-foreground/60">{unitLabel}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {quickAmounts.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setInput(String(value))}
              aria-pressed={amount === value}
              className="rounded-full border border-foreground/15 px-3 py-1 text-sm aria-pressed:border-brand aria-pressed:bg-brand/10 aria-pressed:text-brand"
            >
              {value === packageAmount ? `אריזה (${value} ${unitLabel})` : `${value} ${unitLabel}`}
            </button>
          ))}
        </div>
      </div>

      <MacroSplitBar nutrients={scaled} />

      <NutritionTable
        per100={per100}
        amount={scaled}
        unit={unit}
        amountLabel={`ל־${amount} ${unitLabel}`}
      />
    </section>
  );
}
