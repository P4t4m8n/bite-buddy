import { describe, expect, it } from "vitest";

import { addToDiaryHref, parseMealTypeParam } from "@/lib/diary/links";

describe("addToDiaryHref", () => {
  it("carries the day and the meal type", () => {
    expect(addToDiaryHref("2026-11-13", "LUNCH")).toBe("/diary/add?date=2026-11-13&meal=LUNCH");
  });
});

describe("parseMealTypeParam", () => {
  it("accepts meal types only", () => {
    expect(parseMealTypeParam("DINNER")).toBe("DINNER");
    expect(parseMealTypeParam(["SNACK", "LUNCH"])).toBe("SNACK");
    expect(parseMealTypeParam("dinner")).toBeNull();
    expect(parseMealTypeParam(undefined)).toBeNull();
  });
});
