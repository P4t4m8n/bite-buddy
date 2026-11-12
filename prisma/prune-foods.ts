import "dotenv/config";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

// Removes shared foods (seed / Open Food Facts) that lack kcal, protein, carbs or fat.
// Foods used in a saved meal are kept, because MealItem must point at a food.
// Usage: npm run db:prune-foods [-- --dry-run]

const incomplete: Prisma.FoodWhereInput = {
  hasNutrition: false,
  source: { in: ["SEED", "OFF"] },
};

const main = async () => {
  const dryRun = process.argv.includes("--dry-run");
  const removable = { ...incomplete, mealItems: { none: {} } } satisfies Prisma.FoodWhereInput;

  const inMeals = await db.food.count({ where: { ...incomplete, mealItems: { some: {} } } });

  if (dryRun) {
    const count = await db.food.count({ where: removable });
    console.log(
      `Dry run: would remove ${count} incomplete foods (${inMeals} kept: used in meals).`,
    );
    return;
  }

  const { count } = await db.food.deleteMany({ where: removable });
  const remaining = await db.food.count();
  console.log(
    `Removed ${count} incomplete foods (${inMeals} kept: used in meals). ${remaining} foods left.`,
  );
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
