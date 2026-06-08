"use client";

import { useEffect, useRef, useState } from "react";
import { useCarbonStore } from "@/lib/store/carbon-store";
import type { ChatMessage } from "@/lib/ai/prompt";

const SUGGESTED_PROMPTS = [
  "What's my biggest source of emissions?",
  "Give me three ways to cut my footprint.",
  "How do I compare to a sustainable target?",
];

/**
 * Conversational assistant grounded in the user's logged data.
 *
 * The user's activities are sent with each request so the server can build a
 * factual context block; the assistant streams its reply token by token. If the
 * AI layer is not configured, the component shows a clear, non-blocking notice
 * and the rest of the app continues to work.
 */
export function Assistant() {
  const activities = useCarbonStore((s) => s.activities);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Probe whether the assistant is available on this deployment.
  useEffect(() => {
    let active = true;
    fetch("/api/assistant")
      .then((r) => r.json())
      .then((d) => active && setEnabled(Boolean(d.enabled)))
      .catch(() => active && setEnabled(false));
    return () => {
      active = false;
    };
  }, []);

  // Keep the latest message in view as it streams.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setError(null);
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, activities }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "The assistant is unavailable.");
      }

      // Append an empty assistant message we fill as chunks arrive.
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: copy[copy.length - 1].content + chunk,
          };
          return copy;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setStreaming(false);
    }
  }

  if (enabled === false) {
    return (
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-sm text-muted-foreground">
          The AI assistant isn&apos;t configured on this deployment. Your
          dashboard insights are still fully available — they&apos;re computed
          locally from your logged activities.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-surface">
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96"
        role="log"
        aria-live="polite"
        aria-label="Conversation with the assistant"
      >
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask about your footprint. The assistant answers using your logged
              data.
            </p>
            <ul className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => send(prompt)}
                    disabled={enabled === null}
                    className="rounded-full border border-border px-3 py-1 text-sm hover:bg-surface-muted disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((message, i) => (
          <div
            key={i}
            className={
              message.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-foreground"
              }`}
            >
              <span className="sr-only">
                {message.role === "user" ? "You said: " : "Assistant said: "}
              </span>
              {message.content || (streaming ? "…" : "")}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="px-4 pb-2 text-sm text-opportunity">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <label htmlFor="assistant-input" className="sr-only">
          Message the assistant
        </label>
        <textarea
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={1}
          placeholder="Ask about your footprint…"
          disabled={enabled === null}
          className="flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={streaming || enabled === null || input.trim() === ""}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {streaming ? "Thinking…" : "Send"}
        </button>
      </form>
    </div>
  );
}
