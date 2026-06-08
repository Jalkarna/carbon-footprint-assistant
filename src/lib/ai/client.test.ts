import { describe, expect, it } from "vitest";
import { parseSSEStream } from "@/lib/ai/client";

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
});
