import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hasHebrew } from "@/lib/food/hebrew";
import { normalizeSeedFood, type RawSeedFood } from "@/lib/food/normalize-seed";

// One-off cleanup of seed/foodItems.json: keeps products with a Hebrew name and full macros
// (the same rules the seed uses), and drops everything else.
// Usage: npm run seed:clean [-- --dry-run]

const SEED_FILE = join(process.cwd(), "seed", "foodItems.json");

const keep = (item: RawSeedFood) => hasHebrew(item.name) && normalizeSeedFood(item).hasNutrition;

const main = () => {
  const dryRun = process.argv.includes("--dry-run");
  const raw: RawSeedFood[] = JSON.parse(readFileSync(SEED_FILE, "utf8"));
  const kept = raw.filter(keep);

  console.log(
    `${raw.length} products in file, keeping ${kept.length}, removing ${raw.length - kept.length}.`,
  );
  if (dryRun) return;

  writeFileSync(SEED_FILE, `${JSON.stringify(kept, null, 2)}\n`);
  console.log(`Wrote ${SEED_FILE}`);
};

main();
