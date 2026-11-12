"use client";

import { ClipboardPlus } from "lucide-react";
import { useState } from "react";

import { displayAmount } from "@/lib/nutrition/amount";

import FoodAmountCalculator from "@/components/food/food-amount-calculator";
import AddToMealButton from "@/components/meals/add-to-meal-button";

import type { FoodUnit } from "@/generated/prisma/enums";
import type { FoodNutrition } from "@/lib/nutrition/types";

type FoodAmountActionsProps = {
  foodId: string;
  foodName: string;
  nutrition: FoodNutrition;
  unit: FoodUnit;
  packageAmount: number | null;
  /** Rendered between the calculator and the action buttons (e.g. allergens). */
  children?: React.ReactNode;
};

/** Holds the chosen amount so both the calculator and "add to meal" use it. */
export default function FoodAmountActions({
  foodId,
  foodName,
  nutrition,
  unit,
  packageAmount,
  children,
}: FoodAmountActionsProps) {
  const [input, setInput] = useState("100");

  return (
    <>
      <FoodAmountCalculator
        nutrition={nutrition}
        unit={unit}
        packageAmount={packageAmount}
        input={input}
        onInputChange={setInput}
      />

      {children}

      <div className="grid grid-cols-2 gap-3">
        {/* Enabled in Step 9 (diary). */}
        <button
          type="button"
          disabled
          title="בקרוב"
          className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand font-medium text-white disabled:opacity-50"
        >
          <ClipboardPlus aria-hidden className="size-4" />
          הוספה ליומן
        </button>
        <AddToMealButton
          foodId={foodId}
          foodName={foodName}
          amount={displayAmount(input)}
          unit={unit}
        />
      </div>
    </>
  );
}
