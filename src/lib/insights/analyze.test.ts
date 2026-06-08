import { describe, expect, it } from "vitest";
import { analyzeFootprint, BENCHMARKS } from "@/lib/insights/analyze";
import type { Activity } from "@/lib/emissions/types";

const day = (n: number) => `2026-01-${String(n).padStart(2, "0")}`;

describe("analyzeFootprint", () => {
  it("returns an onboarding insight when there are no activities", () => {
    const analysis = analyzeFootprint([]);
    expect(analysis.totalKg).toBe(0);
    expect(analysis.topCategory).toBeNull();
    expect(analysis.insights).toHaveLength(1);
    expect(analysis.insights[0].id).toBe("empty");
  });

  it("identifies the top-contributing category and its share", () => {
    const activities: Activity[] = [
      { id: "1", factorId: "meal_beef", quantity: 5, date: day(1) }, // 33 diet
      { id: "2", factorId: "train", quantity: 100, date: day(1) }, // 3.5 transport
    ];
    const analysis = analyzeFootprint(activities);
    expect(analysis.topCategory?.category).toBe("diet");
    expect(analysis.topCategory?.share).toBeGreaterThan(80);
    // The headline insight is always first.
    expect(analysis.insights[0].id).toBe("headline");
  });

  it("computes a daily average over distinct logged days", () => {
    const activities: Activity[] = [
      { id: "1", factorId: "electricity", quantity: 10, date: day(1) }, // 4.0
      { id: "2", factorId: "electricity", quantity: 10, date: day(2) }, // 4.0
    ];
    const analysis = analyzeFootprint(activities);
    // total 8.0 over 2 days = 4.0/day
    expect(analysis.dailyAverageKg).toBe(4.0);
  });

  it("flags a high red-meat diet with a quantified saving", () => {
    const activities: Activity[] = [
      { id: "1", factorId: "meal_beef", quantity: 3, date: day(1) },
    ];
    const analysis = analyzeFootprint(activities);
    const insight = analysis.insights.find((i) => i.id === "diet-redmeat");
    expect(insight).toBeDefined();
    expect(insight?.level).toBe("opportunity");
    // 3 * (6.6 - 1.8) = 14.4
    expect(insight?.potentialSavingKg).toBe(14.4);
  });

  it("suggests a transport mode shift for heavy car use", () => {
    const analysis = analyzeFootprint([
      { id: "1", factorId: "car_petrol", quantity: 100, date: day(1) },
    ]);
    const insight = analysis.insights.find((i) => i.id === "transport-modeshift");
    expect(insight).toBeDefined();
    expect(insight?.potentialSavingKg).toBeGreaterThan(0);
  });

  it("celebrates low-carbon travel as a win", () => {
    const analysis = analyzeFootprint([
      { id: "1", factorId: "bike_walk", quantity: 30, date: day(1) },
    ]);
    const win = analysis.insights.find((i) => i.level === "win");
    expect(win).toBeDefined();
    expect(win?.id).toBe("transport-win");
  });

  it("orders opportunities by descending potential saving", () => {
    const analysis = analyzeFootprint([
      { id: "1", factorId: "meal_beef", quantity: 3, date: day(1) }, // saving 14.4
      { id: "2", factorId: "car_petrol", quantity: 50, date: day(1) }, // smaller saving
    ]);
    const opportunities = analysis.insights.filter(
      (i) => typeof i.potentialSavingKg === "number",
    );
    for (let i = 1; i < opportunities.length; i++) {
      expect(opportunities[i - 1].potentialSavingKg!).toBeGreaterThanOrEqual(
        opportunities[i].potentialSavingKg!,
      );
    }
  });

  it("compares the daily average to global and target benchmarks", () => {
    // A very low day: one vegan meal = 0.7 kg, well under target.
    const low = analyzeFootprint([
      { id: "1", factorId: "meal_vegan", quantity: 1, date: day(1) },
    ]);
    expect(low.comparison.vsTarget).toBe("under");
    expect(low.comparison.vsGlobalPct).toBeLessThan(0);

    // A heavy day blows past both benchmarks.
    const high = analyzeFootprint([
      { id: "1", factorId: "meal_beef", quantity: 5, date: day(1) },
    ]);
    expect(high.comparison.vsTarget).toBe("over");
    expect(high.comparison.vsGlobalPct).toBeGreaterThan(0);
  });

  it("exposes sane benchmark constants", () => {
    expect(BENCHMARKS.globalDailyAvg).toBeGreaterThan(
      BENCHMARKS.sustainableDailyTarget,
    );
    expect(BENCHMARKS.sustainableDailyTarget).toBeGreaterThan(0);
  });
});
