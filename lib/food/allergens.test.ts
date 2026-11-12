import { describe, expect, it } from "vitest";
import { translateAllergen } from "@/lib/food/allergens";

describe("translateAllergen", () => {
  it("translates known English allergen names", () => {
    expect(translateAllergen("gluten")).toBe("גלוטן");
    expect(translateAllergen("Sesame seeds")).toBe("שומשום");
  });

  it("strips the he: prefix and keeps Hebrew or unknown names", () => {
    expect(translateAllergen("he:שעורה")).toBe("שעורה");
    expect(translateAllergen("grapefruit")).toBe("grapefruit");
  });
});
