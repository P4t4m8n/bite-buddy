import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

describe("safeCallbackUrl", () => {
  it("keeps relative paths with query and hash", () => {
    expect(safeCallbackUrl("/meals/123?tab=items#top")).toBe("/meals/123?tab=items#top");
  });

  it("reduces absolute URLs to their path", () => {
    expect(safeCallbackUrl("http://localhost:3000/stats")).toBe("/stats");
    expect(safeCallbackUrl("https://evil.example/steal")).toBe("/steal");
  });

  it("blocks protocol-relative and backslash tricks", () => {
    expect(safeCallbackUrl("//evil.example")).toBe("/");
    expect(safeCallbackUrl("/\\evil.example")).toBe("/");
  });

  it("falls back to home for missing values or the sign-in page itself", () => {
    expect(safeCallbackUrl(undefined)).toBe("/");
    expect(safeCallbackUrl(["/a", "/b"])).toBe("/");
    expect(safeCallbackUrl("/sign-in?callbackUrl=/x")).toBe("/");
  });
});
