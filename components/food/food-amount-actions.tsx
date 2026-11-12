"use client";

import { useState } from "react";

import { displayAmount } from "@/lib/nutrition/amount";

import LogButton from "@/components/diary/log-button";
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
        <LogButton
          target={{ kind: "food", foodId, name: foodName, amount: displayAmount(input), unit }}
        />
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
