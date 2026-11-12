import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "@/lib/db";
import { normalizeSeedFood, type RawSeedFood } from "@/lib/food/normalize-seed";

const SEED_FILE = join(import.meta.dirname, "..", "seed", "foodItems.json");
const BATCH_SIZE = 1000;

async function main() {
  const raw: RawSeedFood[] = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  const foods = raw.map(normalizeSeedFood);

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
  const complete = foods.filter((f) => f.hasNutrition).length;
  console.log(
    `Seed foods: ${foods.length} in file, ${inserted} inserted, ${foods.length - inserted} skipped. ` +
      `${total} seed foods in DB (${complete} with full macros).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
