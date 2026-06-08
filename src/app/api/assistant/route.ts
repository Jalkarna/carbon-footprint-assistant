import { z } from "zod";
import { analyzeFootprint } from "@/lib/insights/analyze";
import { activityInputSchema } from "@/lib/store/helpers";
import { streamChat, AINotConfiguredError } from "@/lib/ai/client";
import { isAIEnabled } from "@/lib/ai/config";
import {
  buildMessages,
  MAX_USER_MESSAGE_LENGTH,
  MAX_HISTORY_MESSAGES,
} from "@/lib/ai/prompt";
import { rateLimit } from "@/lib/ai/rate-limit";

// Run on the Node.js runtime so the server-only AI client and its key stay
// strictly server-side.
export const runtime = "nodejs";

/** Request body: chat history plus the user's current activity log for grounding. */
const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(MAX_USER_MESSAGE_LENGTH),
      }),
    )
    .min(1, "At least one message is required")
    .max(MAX_HISTORY_MESSAGES * 2),
  activities: z.array(activityInputSchema.extend({ id: z.string() })).max(5_000),
});

function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "anonymous";
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request): Promise<Response> {
  if (!isAIEnabled()) {
    return jsonError(
      "The AI assistant is not configured on this deployment. The dashboard insights still work fully.",
      503,
    );
  }

  const limit = rateLimit(clientKey(req));
  if (!limit.allowed) {
    return jsonError("Too many requests. Please wait a moment.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }

  // Ground the model in the user's real, deterministically-computed footprint.
  const analysis = analyzeFootprint(parsed.data.activities);
  const messages = buildMessages(analysis, parsed.data.messages);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of streamChat(messages)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        const message =
          error instanceof AINotConfiguredError
            ? "AI assistant is not configured."
            : "The assistant is temporarily unavailable. Please try again.";
        controller.enqueue(encoder.encode(`\n\n[${message}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** Lightweight capability probe so the UI can show/hide the assistant. */
export async function GET(): Promise<Response> {
  return new Response(JSON.stringify({ enabled: isAIEnabled() }), {
    headers: { "Content-Type": "application/json" },
  });
}
