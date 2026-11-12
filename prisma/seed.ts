import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@/lib/db";
import { normalizeSeedFood, type RawSeedFood } from "@/lib/food/normalize-seed";

const SEED_FILE = join(import.meta.dirname, "..", "seed", "foodItems.json");
const BATCH_SIZE = 1000;

async function main() {
  const raw: RawSeedFood[] = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  // Foods without kcal, protein, carbs and fat aren't useful for tracking, so they are skipped.
  const foods = raw.map(normalizeSeedFood).filter((food) => food.hasNutrition);

  let inserted = 0;
  for (let i = 0; i < foods.length; i += BATCH_SIZE) {
    // Barcode is unique, so re-running the seed skips foods that already exist.
    const { count } = await db.food.createMany({
      data: foods.slice(i, i + BATCH_SIZE),
      skipDuplicates: true,
    });
    inserted += count;
  }

  const total = await db.food.count({ where: { source: "SEED" } });
  console.log(
    `Seed foods: ${raw.length} in file, ${raw.length - foods.length} skipped without full macros, ` +
      `${inserted} inserted, ${foods.length - inserted} already in DB. ${total} seed foods in DB.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
