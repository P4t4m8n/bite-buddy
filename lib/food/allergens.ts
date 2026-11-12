// Open Food Facts allergen names, which arrive in English or as "he:<name>".
const HEBREW_ALLERGENS: Record<string, string> = {
  gluten: "גלוטן",
  milk: "חלב",
  soybeans: "סויה",
  nuts: "אגוזים",
  peanuts: "בוטנים",
  "sesame seeds": "שומשום",
  mustard: "חרדל",
  eggs: "ביצים",
  celery: "סלרי",
  fish: "דגים",
  crustaceans: "סרטנים",
  molluscs: "רכיכות",
  lupin: "תורמוס",
  "sulphur dioxide and sulphites": "גופרית דו־חמצנית וסולפיטים",
};

export const translateAllergen = (name: string): string => {
  const clean = name.replace(/^he:/, "").trim();
  return HEBREW_ALLERGENS[clean.toLowerCase()] ?? clean;
};
