import { describe, expect, it } from "vitest";
import {
  buildFootprintContext,
  buildMessages,
  MAX_HISTORY_MESSAGES,
  MAX_USER_MESSAGE_LENGTH,
  SYSTEM_PROMPT,
} from "@/lib/ai/prompt";
import { analyzeFootprint } from "@/lib/insights/analyze";
import type { Activity } from "@/lib/emissions/types";

const sample: Activity[] = [
  { id: "1", factorId: "meal_beef", quantity: 3, date: "2026-01-01" },
  { id: "2", factorId: "car_petrol", quantity: 40, date: "2026-01-01" },
];

describe("buildFootprintContext", () => {
  it("describes an empty log without inventing numbers", () => {
    const ctx = buildFootprintContext(analyzeFootprint([]));
    expect(ctx).toMatch(/not logged any activities/i);
  });

  it("includes the real totals and the top category", () => {
    const ctx = buildFootprintContext(analyzeFootprint(sample));
    expect(ctx).toMatch(/Total logged footprint/);
    expect(ctx).toMatch(/Biggest source/);
    expect(ctx).toMatch(/Diet/); // beef-heavy → diet dominates
  });
});

describe("buildMessages", () => {
  it("prepends the system prompt and grounded context", () => {
    const messages = buildMessages(analyzeFootprint(sample), [
      { role: "user", content: "How am I doing?" },
    ]);
    expect(messages[0]).toEqual({ role: "system", content: SYSTEM_PROMPT });
    expect(messages[1].role).toBe("system");
    expect(messages[1].content).toMatch(/FOOTPRINT CONTEXT/);
    expect(messages[2]).toEqual({ role: "user", content: "How am I doing?" });
  });

  it("clamps history length and message size", () => {
    const longContent = "x".repeat(MAX_USER_MESSAGE_LENGTH + 500);
    const history = Array.from(
      { length: MAX_HISTORY_MESSAGES + 10 },
      (_, i) => ({
        role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
        content: longContent,
      }),
    );
    const messages = buildMessages(analyzeFootprint([]), history);
    // 2 system messages + at most MAX_HISTORY_MESSAGES of history.
    expect(messages.length).toBeLessThanOrEqual(2 + MAX_HISTORY_MESSAGES);
    const lastUser = messages[messages.length - 1];
    expect(lastUser.content.length).toBeLessThanOrEqual(
      MAX_USER_MESSAGE_LENGTH,
    );
  });
});
