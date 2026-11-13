import { describe, expect, it } from "vitest";

import {
  copyMealName,
  itemCountLabel,
  moveItem,
  parseMealQuery,
  parsePageParam,
  publicMealsHref,
  withPositions,
} from "@/lib/meals/helpers";

describe("parseMealQuery", () => {
  it("trims and takes the first value", () => {
    expect(parseMealQuery("  בוקר ")).toBe("בוקר");
    expect(parseMealQuery(["ערב", "בוקר"])).toBe("ערב");
    expect(parseMealQuery(undefined)).toBe("");
  });

  it("caps the query at a meal name's length", () => {
    expect(parseMealQuery("א".repeat(200))).toHaveLength(80);
  });
});

describe("publicMealsHref", () => {
  it("keeps the search and drops page 1", () => {
    expect(publicMealsHref(1)).toBe("/meals/public");
    expect(publicMealsHref(2)).toBe("/meals/public?page=2");
    expect(publicMealsHref(3, "סלט")).toBe(`/meals/public?q=${encodeURIComponent("סלט")}&page=3`);
  });
});

describe("copyMealName", () => {
  it("adds the copy suffix", () => {
    expect(copyMealName("דייסת שיבולת שועל")).toBe("דייסת שיבולת שועל (עותק)");
  });

  it("shortens long names so the result fits 80 characters", () => {
    const name = copyMealName("א".repeat(80));
    expect(name).toHaveLength(80);
    expect(name.endsWith(" (עותק)")).toBe(true);
  });
});

describe("withPositions", () => {
  it("numbers items in order from 0", () => {
    expect(withPositions([{ foodId: "a" }, { foodId: "b" }])).toEqual([
      { foodId: "a", position: 0 },
      { foodId: "b", position: 1 },
    ]);
  });
});

describe("moveItem", () => {
  const list = ["a", "b", "c"];

  it("moves an item up or down without changing the input", () => {
    expect(moveItem(list, 2, -1)).toEqual(["a", "c", "b"]);
    expect(moveItem(list, 0, 1)).toEqual(["b", "a", "c"]);
    expect(list).toEqual(["a", "b", "c"]);
  });

  it("ignores moves past either end", () => {
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 2, 1)).toBe(list);
    expect(moveItem(list, 5, -1)).toBe(list);
  });
});

describe("parsePageParam", () => {
  it("reads a page number and falls back to 1", () => {
    expect(parsePageParam("3")).toBe(3);
    expect(parsePageParam(["2", "5"])).toBe(2);
    expect(parsePageParam(undefined)).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("1.5")).toBe(1);
  });
});

describe("itemCountLabel", () => {
  it("uses Hebrew singular and plural forms", () => {
    expect(itemCountLabel(0)).toBe("ללא מוצרים");
    expect(itemCountLabel(1)).toBe("מוצר אחד");
    expect(itemCountLabel(3)).toBe("3 מוצרים");
  });
});
