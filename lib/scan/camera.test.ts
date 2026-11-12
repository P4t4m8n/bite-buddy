import { describe, expect, it } from "vitest";

import { cameraProblem, createReadDebouncer } from "@/lib/scan/camera";

const domError = (name: string) => new DOMException("x", name);

describe("cameraProblem", () => {
  it("maps getUserMedia errors to user-facing states", () => {
    expect(cameraProblem(domError("NotAllowedError"))).toBe("denied");
    expect(cameraProblem(domError("SecurityError"))).toBe("denied");
    expect(cameraProblem(domError("NotFoundError"))).toBe("no-camera");
    expect(cameraProblem(domError("OverconstrainedError"))).toBe("no-camera");
    expect(cameraProblem(domError("NotReadableError"))).toBe("busy");
    expect(cameraProblem(new TypeError("boom"))).toBe("error");
    expect(cameraProblem("nope")).toBe("error");
  });
});

describe("createReadDebouncer", () => {
  it("ignores the same code within the window", () => {
    const accept = createReadDebouncer(2000);
    expect(accept("7290004127329", 0)).toBe(true);
    expect(accept("7290004127329", 500)).toBe(false);
    expect(accept("7290004127329", 1999)).toBe(false);
    expect(accept("7290004127329", 2600)).toBe(true);
  });

  it("accepts a different code right away", () => {
    const accept = createReadDebouncer(2000);
    expect(accept("7290004127329", 0)).toBe(true);
    expect(accept("96385074", 10)).toBe(true);
    expect(accept("7290004127329", 20)).toBe(true);
  });
});
