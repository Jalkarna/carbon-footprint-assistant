import { describe, expect, it } from "vitest";
import { formatKg, CATEGORY_COLOR } from "@/components/ui";

describe("formatKg", () => {
  it("shows kg below a tonne", () => {
    expect(formatKg(5.4)).toBe("5.4 kg");
    expect(formatKg(42)).toBe("42 kg");
  });

  it("switches to tonnes at or above 1000 kg", () => {
    expect(formatKg(1500)).toBe("1.50 t");
  });
});

describe("CATEGORY_COLOR", () => {
  it("maps every category to a colour token", () => {
    expect(CATEGORY_COLOR.transport).toMatch(/--color-cat-transport/);
    expect(CATEGORY_COLOR.energy).toMatch(/--color-cat-energy/);
    expect(CATEGORY_COLOR.diet).toMatch(/--color-cat-diet/);
    expect(CATEGORY_COLOR.shopping).toMatch(/--color-cat-shopping/);
  });
});
