import "dotenv/config";
import { db } from "@/lib/db";
import { HEBREW_LETTER_PATTERN } from "@/lib/food/hebrew";

// Removes shared foods (seed / Open Food Facts) that lack kcal, protein, carbs or fat,
// or whose name has no Hebrew letters. Foods used in a saved meal are kept,
// because MealItem must point at a food.
// Usage: npm run db:prune-foods [-- --dry-run]

const main = async () => {
  const dryRun = process.argv.includes("--dry-run");

  const candidates = await db.$queryRaw<{ id: string; inMeal: boolean }[]>`
    SELECT f.id, EXISTS (SELECT 1 FROM "MealItem" mi WHERE mi."foodId" = f.id) AS "inMeal"
    FROM "Food" f
    WHERE f.source IN ('SEED', 'OFF')
      AND (NOT f."hasNutrition" OR f.name !~ ${HEBREW_LETTER_PATTERN})
  `;
  const removable = candidates.filter((c) => !c.inMeal).map((c) => c.id);
  const kept = candidates.length - removable.length;

  if (dryRun) {
    console.log(`Dry run: would remove ${removable.length} foods (${kept} kept: used in meals).`);
    return;
  }

  const { count } = await db.food.deleteMany({ where: { id: { in: removable } } });
  const remaining = await db.food.count();
  console.log(`Removed ${count} foods (${kept} kept: used in meals). ${remaining} foods left.`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
