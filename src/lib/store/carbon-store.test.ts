import { beforeEach, describe, expect, it } from "vitest";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { activityInputSchema, makeId, todayISO } from "@/lib/store/helpers";

// Reset store state between tests (localStorage is jsdom-backed).
beforeEach(() => {
  useCarbonStore.setState({ activities: [], goal: null });
  localStorage.clear();
});

describe("helpers", () => {
  it("formats today as ISO YYYY-MM-DD", () => {
    expect(todayISO(new Date("2026-03-05T12:00:00"))).toBe("2026-03-05");
    expect(todayISO(new Date("2026-12-31T23:59:00"))).toBe("2026-12-31");
  });

  it("generates unique ids", () => {
    const a = makeId();
    const b = makeId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });
});

describe("activityInputSchema", () => {
  it("accepts a valid activity", () => {
    const result = activityInputSchema.safeParse({
      factorId: "car_petrol",
      quantity: 12,
      date: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown factor", () => {
    const result = activityInputSchema.safeParse({
      factorId: "spaceship",
      quantity: 12,
      date: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ["negative quantity", { quantity: -1 }],
    ["non-finite quantity", { quantity: Infinity }],
    ["bad date", { date: "01/01/2026" }],
  ])("rejects %s", (_label, override) => {
    const result = activityInputSchema.safeParse({
      factorId: "car_petrol",
      quantity: 10,
      date: "2026-01-01",
      ...override,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an over-long note", () => {
    const result = activityInputSchema.safeParse({
      factorId: "car_petrol",
      quantity: 10,
      date: "2026-01-01",
      note: "x".repeat(281),
    });
    expect(result.success).toBe(false);
  });
});

describe("useCarbonStore", () => {
  it("adds a valid activity to the front of the list", () => {
    const { addActivity } = useCarbonStore.getState();
    const r1 = addActivity({
      factorId: "car_petrol",
      quantity: 10,
      date: "2026-01-01",
    });
    const r2 = addActivity({
      factorId: "train",
      quantity: 5,
      date: "2026-01-02",
    });
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    const { activities } = useCarbonStore.getState();
    expect(activities).toHaveLength(2);
    expect(activities[0].factorId).toBe("train"); // newest first
  });

  it("rejects an invalid activity and does not store it", () => {
    const result = useCarbonStore
      .getState()
      .addActivity({ factorId: "nope", quantity: 10, date: "2026-01-01" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/unknown/i);
    expect(useCarbonStore.getState().activities).toHaveLength(0);
  });

  it("removes an activity by id", () => {
    const { addActivity } = useCarbonStore.getState();
    const added = addActivity({
      factorId: "train",
      quantity: 5,
      date: "2026-01-02",
    });
    expect(added.ok).toBe(true);
    if (added.ok) useCarbonStore.getState().removeActivity(added.activity.id);
    expect(useCarbonStore.getState().activities).toHaveLength(0);
  });

  it("sets and clears a goal, clamping negatives to zero", () => {
    const { setGoal } = useCarbonStore.getState();
    setGoal(5);
    expect(useCarbonStore.getState().goal?.dailyTargetKg).toBe(5);
    setGoal(-3);
    expect(useCarbonStore.getState().goal?.dailyTargetKg).toBe(0);
    setGoal(null);
    expect(useCarbonStore.getState().goal).toBeNull();
  });

  it("clears all data", () => {
    const { addActivity, setGoal, clearAll } = useCarbonStore.getState();
    addActivity({ factorId: "train", quantity: 5, date: "2026-01-02" });
    setGoal(5);
    clearAll();
    const state = useCarbonStore.getState();
    expect(state.activities).toHaveLength(0);
    expect(state.goal).toBeNull();
  });
});
