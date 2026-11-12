import { describe, expect, it } from "vitest";
import { escapeLike, parseFoodSearchParams, searchHref } from "@/lib/food/search-params";

describe("parseFoodSearchParams", () => {
  it("trims the query and reads the page", () => {
    expect(parseFoodSearchParams({ q: "  peanut butter ", page: "3" })).toEqual({
      q: "peanut butter",
      page: 3,
    });
  });

  it("uses the first value of repeated params", () => {
    expect(parseFoodSearchParams({ q: ["milk", "eggs"], page: ["2", "9"] })).toEqual({
      q: "milk",
      page: 2,
    });
  });

  it("falls back to defaults for missing or invalid values", () => {
    expect(parseFoodSearchParams({})).toEqual({ q: "", page: 1 });
    expect(parseFoodSearchParams({ q: "x".repeat(101), page: "-1" })).toEqual({ q: "", page: 1 });
    expect(parseFoodSearchParams({ q: "oats", page: "abc" }).page).toBe(1);
    expect(parseFoodSearchParams({ q: "oats", page: "999" }).page).toBe(1);
  });
});

describe("escapeLike", () => {
  it("escapes LIKE wildcards and backslashes", () => {
    expect(escapeLike("100%_juice\\")).toBe("100\\%\\_juice\\\\");
  });
});

describe("searchHref", () => {
  it("builds search URLs and omits page 1", () => {
    expect(searchHref("peanut butter")).toBe("/search?q=peanut+butter");
    expect(searchHref("milk", 2)).toBe("/search?q=milk&page=2");
  });
});
