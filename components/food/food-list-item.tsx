import Link from "next/link";
import { FoodImage } from "@/components/food/food-image";
import type { FoodSearchResult } from "@/lib/food/search";
import { roundNutrient, UNIT_LABELS } from "@/lib/nutrition/format";

export const FoodListItem = ({ food }: { food: FoodSearchResult }) => (
  <li>
    <Link
      href={`/food/${food.id}`}
      className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-foreground/5"
    >
      <FoodImage src={food.imageUrl} name={food.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{food.name}</p>
        {food.brands.length > 0 ? (
          <p className="truncate text-sm text-foreground/60">{food.brands.join(", ")}</p>
        ) : null}
        <p className="mt-0.5 text-xs text-foreground/60">
          <span className="font-medium text-foreground">
            {roundNutrient("kcal", food.kcal100)} קק״ל
          </span>{" "}
          ל־100 {UNIT_LABELS[food.unit]} · חלבון {roundNutrient("protein", food.protein100)} ·
          פחמימות {roundNutrient("carbs", food.carbs100)} · שומן {roundNutrient("fat", food.fat100)}
        </p>
      </div>
    </Link>
  </li>
);
