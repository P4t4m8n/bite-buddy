import { describe, expect, it } from "vitest";
import { isNavItemActive } from "@/lib/navigation";

describe("isNavItemActive", () => {
  it("matches the home item only on the exact root path", () => {
    expect(isNavItemActive("/", "/")).toBe(true);
    expect(isNavItemActive("/meals", "/")).toBe(false);
  });

  it("matches a section and its nested pages", () => {
    expect(isNavItemActive("/meals", "/meals")).toBe(true);
    expect(isNavItemActive("/meals/123", "/meals")).toBe(true);
  });

  it("does not match paths that only share a prefix", () => {
    expect(isNavItemActive("/mealsplan", "/meals")).toBe(false);
  });
});
