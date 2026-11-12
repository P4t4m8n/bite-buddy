import { Food } from "@/generated/prisma/client";
import { FoodImage } from "./food/food-image";
import { translateAllergen } from "@/lib/food/allergens";
import { UNIT_LABELS } from "@/lib/nutrition/format";
import FoodAmountActions from "./food/food-amount-actions";
import { NutriScoreBadge, NovaBadge } from "./food/food-badges";

type FoodDetailsProps = {
  food: Food;
};
export default function FoodDetails({ food }: FoodDetailsProps) {
  return (
    <article className="space-y-6">
      <Header food={food} />

      <FoodAmountActions
        foodId={food.id}
        foodName={food.name}
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
      >
        <Allergens allergens={food.allergens} />
      </FoodAmountActions>
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
