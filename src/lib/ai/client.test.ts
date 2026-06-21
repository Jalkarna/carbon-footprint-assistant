import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AINotConfiguredError,
  parseSSEStream,
  streamChat,
} from "@/lib/ai/client";
import type { AIConfig } from "@/lib/ai/config";

/** Build a ReadableStream from string chunks for testing the SSE parser. */
function streamFrom(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    },
  });
}

async function collect(gen: AsyncGenerator<string>): Promise<string> {
  let out = "";
  for await (const chunk of gen) out += chunk;
  return out;
}

describe("parseSSEStream", () => {
  it("concatenates delta content across events", async () => {
    const stream = streamFrom([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":", world"}}]}\n\n',
      "data: [DONE]\n\n",
    ]);
    expect(await collect(parseSSEStream(stream))).toBe("Hello, world");
  });

  it("handles events split across chunk boundaries", async () => {
    const stream = streamFrom([
      'data: {"choices":[{"delta":{"con',
      'tent":"split"}}]}\n\n',
    ]);
    expect(await collect(parseSSEStream(stream))).toBe("split");
  });

  it("ignores malformed and keep-alive lines", async () => {
    const stream = streamFrom([
      ": keep-alive\n\n",
      "data: not-json\n\n",
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n',
    ]);
    expect(await collect(parseSSEStream(stream))).toBe("ok");
  });

  it("flushes a trailing event with no closing blank line", async () => {
    const stream = streamFrom([
      'data: {"choices":[{"delta":{"content":"tail"}}]}',
    ]);
    expect(await collect(parseSSEStream(stream))).toBe("tail");
  });

  it("ignores deltas that are not strings", async () => {
    const stream = streamFrom([
      'data: {"choices":[{"delta":{"content":42}}]}\n\n',
      'data: {"choices":[{"delta":{}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"valid"}}]}\n\n',
    ]);
    expect(await collect(parseSSEStream(stream))).toBe("valid");
  });
});

/** A minimal config that points streamChat at a fake endpoint. */
const testConfig: AIConfig = {
  apiKey: "test-key",
  baseURL: "https://example.test/v1",
  models: ["model-a", "model-b"],
  timeoutMs: 1000,
};

/** Build a Response whose body streams the given SSE chunks. */
function okResponse(chunks: string[]): Response {
  return new Response(streamFrom(chunks), { status: 200 });
}

describe("streamChat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("streams text from the primary model when it succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        okResponse(['data: {"choices":[{"delta":{"content":"hi"}}]}\n\n']),
      );
    vi.stubGlobal("fetch", fetchMock);

    const out = await collect(
      streamChat([{ role: "user", content: "q" }], testConfig),
    );

    expect(out).toBe("hi");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // The configured model and auth header are sent to the right URL.
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.test/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-key",
    );
    expect(JSON.parse(init.body).model).toBe("model-a");
  });

  it("falls back to the next model when the first returns a non-OK status", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("nope", { status: 503 }))
      .mockResolvedValueOnce(
        okResponse([
          'data: {"choices":[{"delta":{"content":"recovered"}}]}\n\n',
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const out = await collect(
      streamChat([{ role: "user", content: "q" }], testConfig),
    );

    expect(out).toBe("recovered");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // The retry used the second configured model.
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).model).toBe("model-b");
  });

  it("falls back when a fetch rejects (e.g. network/timeout)", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(
        okResponse(['data: {"choices":[{"delta":{"content":"ok"}}]}\n\n']),
      );
    vi.stubGlobal("fetch", fetchMock);

    const out = await collect(
      streamChat([{ role: "user", content: "q" }], testConfig),
    );
    expect(out).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws after every model fails, surfacing the last error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("a", { status: 500 }))
      .mockResolvedValueOnce(new Response("b", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      collect(streamChat([{ role: "user", content: "q" }], testConfig)),
    ).rejects.toThrow(/All AI models failed/);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("treats a missing response body as a failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      collect(streamChat([{ role: "user", content: "q" }], testConfig)),
    ).rejects.toThrow(/All AI models failed/);
  });
});

describe("AINotConfiguredError", () => {
  it("carries a recognisable name and message", () => {
    const error = new AINotConfiguredError();
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AINotConfiguredError");
    expect(error.message).toMatch(/not configured/i);
  });
});
