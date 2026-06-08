import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/ai/rate-limit";

/**
 * Route handler tests. The AI client is mocked so we exercise validation,
 * graceful degradation, and the streaming wrapper without hitting the network.
 */

// Mock the AI client module before importing the route.
vi.mock("@/lib/ai/client", () => ({
  AINotConfiguredError: class extends Error {},
  // Yield two chunks to simulate a streamed completion.
  streamChat: async function* () {
    yield "Hello ";
    yield "world";
  },
}));

const enabledState = { value: true };
vi.mock("@/lib/ai/config", () => ({
  isAIEnabled: () => enabledState.value,
}));

import { POST, GET } from "@/app/api/assistant/route";

function makeRequest(body: unknown, raw = false): Request {
  return new Request("http://localhost/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "1.2.3.4" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const validBody = {
  messages: [{ role: "user", content: "How am I doing?" }],
  activities: [
    { id: "1", factorId: "car_petrol", quantity: 10, date: "2026-01-01" },
  ],
};

beforeEach(() => {
  enabledState.value = true;
  resetRateLimits();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/assistant", () => {
  it("reports the AI capability", async () => {
    const res = await GET();
    expect(await res.json()).toEqual({ enabled: true });
  });
});

describe("POST /api/assistant", () => {
  it("streams the assistant reply for a valid request", async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.text()).toBe("Hello world");
  });

  it("returns 503 when the AI layer is not configured", async () => {
    enabledState.value = false;
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(503);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(makeRequest("{ not json", true));
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages are missing", async () => {
    const res = await POST(makeRequest({ activities: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when an activity references an unknown factor", async () => {
    const res = await POST(
      makeRequest({
        messages: [{ role: "user", content: "hi" }],
        activities: [
          { id: "1", factorId: "rocket", quantity: 1, date: "2026-01-01" },
        ],
      }),
    );
    expect(res.status).toBe(400);
  });

  it("enforces the rate limit after enough requests", async () => {
    let last: Response | null = null;
    for (let i = 0; i < 25; i++) {
      last = await POST(makeRequest(validBody));
    }
    expect(last?.status).toBe(429);
  });
});
