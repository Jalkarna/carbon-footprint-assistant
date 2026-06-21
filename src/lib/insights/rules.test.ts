import { describe, expect, it } from "vitest";
import { swapSavingPerUnit, sumQuantity } from "@/lib/insights/rules";
import { computeActivities } from "@/lib/emissions/calculate";
import { getFactor } from "@/lib/emissions/factors";
import type { Activity } from "@/lib/emissions/types";

describe("swapSavingPerUnit", () => {
  it("returns the per-unit factor delta for a real swap", () => {
    const beef = getFactor("meal_beef")!.perUnitKg;
    const poultry = getFactor("meal_poultry")!.perUnitKg;
    expect(swapSavingPerUnit("meal_beef", "meal_poultry")).toBeCloseTo(
      beef - poultry,
      5,
    );
  });

  it("never returns a negative saving for a worse swap", () => {
    // Swapping a low-carbon option for a higher-carbon one yields no saving.
    expect(swapSavingPerUnit("train", "car_petrol")).toBe(0);
  });

  it("treats unknown factors as zero", () => {
    expect(swapSavingPerUnit("nope", "also_nope")).toBe(0);
    expect(swapSavingPerUnit("meal_beef", "nope")).toBeGreaterThan(0);
  });
});

describe("sumQuantity", () => {
  const activities: Activity[] = [
    { id: "1", factorId: "meal_vegan", quantity: 2, date: "2026-01-01" },
    { id: "2", factorId: "meal_vegetarian", quantity: 3, date: "2026-01-01" },
    { id: "3", factorId: "car_petrol", quantity: 10, date: "2026-01-01" },
  ];
  const computed = computeActivities(activities);

  it("sums a single factor", () => {
    expect(sumQuantity(computed, "car_petrol")).toBe(10);
  });

  it("sums across multiple factors", () => {
    expect(sumQuantity(computed, "meal_vegan", "meal_vegetarian")).toBe(5);
  });

  it("returns zero when no factor matches", () => {
    expect(sumQuantity(computed, "flight_short")).toBe(0);
  });
});
