import { Food } from "@/generated/prisma/client";
import { FoodImage } from "./food/food-image";
import { translateAllergen } from "@/lib/food/allergens";
import { UNIT_LABELS } from "@/lib/nutrition/format";
import { ClipboardPlus, UtensilsCrossed } from "lucide-react";
import  FoodAmountCalculator  from "./food/food-amount-calculator";
import { NutriScoreBadge, NovaBadge } from "./food/food-badges";

type FoodDetailsProps = {
  food: Food;
};
export default function FoodDetails({ food }: FoodDetailsProps) {
  return (
    <article className="space-y-6">
      <Header food={food} />

      <FoodAmountCalculator
        nutrition={{
          kcal100: food.kcal100,
          protein100: food.protein100,
          carbs100: food.carbs100,
          fat100: food.fat100,
          fiber100: food.fiber100,
          sugar100: food.sugar100,
          satFat100: food.satFat100,
          sodium100: food.sodium100,
        }}
        unit={food.unit}
        packageAmount={food.packageAmount}
      />

      <Allergens allergens={food.allergens} />

      {/* Enabled in Step 7 (meals) and Step 9 (diary). */}
      <Actions />
    </article>
  );
}

const Header = ({ food }: { food: Food }) => (
  <header className="flex gap-4">
    <FoodImage src={food.imageUrl} name={food.name} size={96} />
    <div className="min-w-0">
      <h1 className="text-xl font-semibold tracking-tight">{food.name}</h1>
      {food.brands.length > 0 ? (
        <p className="text-sm text-foreground/60">{food.brands.join(", ")}</p>
      ) : null}
      {food.packageAmount ? (
        <p className="text-sm text-foreground/60">
          אריזה: {food.packageAmount} {UNIT_LABELS[food.unit]}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {food.nutritionGrade ? <NutriScoreBadge grade={food.nutritionGrade} /> : null}
        {food.novaGroup ? <NovaBadge group={food.novaGroup} /> : null}
      </div>
    </div>
  </header>
);

const Allergens = ({ allergens }: { allergens: string[] }) => {
  if (allergens.length === 0) return null;
  return (
    <section>
      <h2 className="text-sm font-medium">אלרגנים</h2>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {allergens.map((allergen) => (
          <li
            key={allergen}
            className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300"
          >
            {translateAllergen(allergen)}
          </li>
        ))}
      </ul>
    </section>
  );
};

const Actions = () => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        disabled
        title="בקרוב"
        className="flex h-11 items-center justify-center gap-2 rounded-full bg-brand font-medium text-white disabled:opacity-50"
      >
        <ClipboardPlus aria-hidden className="size-4" />
        הוספה ליומן
      </button>
      <button
        type="button"
        disabled
        title="בקרוב"
        className="flex h-11 items-center justify-center gap-2 rounded-full border border-foreground/15 font-medium disabled:opacity-50"
      >
        <UtensilsCrossed aria-hidden className="size-4" />
        הוספה לארוחה
      </button>
    </div>
  );
};
