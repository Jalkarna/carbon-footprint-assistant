"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  MessageSquareOff,
  RotateCcw,
  Route,
  Salad,
  Target,
  TrendingDown,
} from "lucide-react";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { Markdown } from "./Markdown";
import { useAssistantChat } from "./useAssistantChat";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

const SUGGESTIONS = [
  { icon: TrendingDown, text: "What's driving my emissions the most?" },
  { icon: Route, text: "Give me three concrete ways to cut my footprint." },
  { icon: Target, text: "Am I on track for a sustainable lifestyle?" },
  { icon: Salad, text: "How much could diet changes save me?" },
];

/**
 * Conversational assistant. Refined dark chat surface — no gradient text, no
 * glow. Replies stream token-by-token and render through a safe inline
 * markdown renderer. Fully keyboard operable; the transcript is an aria-live
 * log and each turn is labelled for screen readers.
 */
export function AssistantChat() {
  const getActivities = useCarbonStore.getState;
  const { messages, status, enabled, error, send, reset } = useAssistantChat(
    () => getActivities().activities,
  );
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streaming = status === "streaming";

  // Keep newest content in view as it streams.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  // Auto-grow the textarea up to a max height.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  async function submit(text: string) {
    if (!text.trim() || streaming) return;
    setInput("");
    await send(text);
    inputRef.current?.focus();
  }

  if (enabled === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-[var(--r-lg)] border border-[var(--border)] bg-surface-2"
        >
          <MessageSquareOff className="size-5 text-fg-muted" />
        </span>
        <p className="font-semibold text-fg">Assistant not configured</p>
        <p className="max-w-sm text-sm text-fg-muted">
          This deployment has no AI key set. Your dashboard and insights still
          work fully — they&apos;re computed locally from your activities.
        </p>
      </div>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Transcript */}
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label="Conversation with the assistant"
        className="scroll-thin flex-1 overflow-y-auto"
      >
        {!hasMessages ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-4 py-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold tracking-tight text-fg">
                How can I help with your footprint?
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
                Ask anything — answers are grounded in your real logged data, not
                generic estimates.
              </p>
            </div>
            <ul className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <button
                    type="button"
                    onClick={() => submit(text)}
                    disabled={enabled === null || streaming}
                    className="flex w-full items-center gap-3 rounded-[var(--r-md)] border border-[var(--border)] bg-surface px-3 py-2.5 text-left text-sm text-fg-muted transition-colors hover:border-[var(--border-strong)] hover:bg-surface-2 hover:text-fg disabled:opacity-50 cursor-pointer"
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[var(--accent)]"
                    />
                    {text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-[var(--r-lg)] px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-[var(--accent-subtle)] text-fg"
                      : "border border-[var(--border)] bg-surface text-fg",
                  )}
                >
                  <span className="sr-only">
                    {m.role === "user" ? "You said: " : "Assistant said: "}
                  </span>
                  {m.role === "assistant" ? (
                    m.content ? (
                      <Markdown content={m.content} />
                    ) : (
                      <span className="inline-flex gap-1" aria-label="Thinking">
                        <span className="thinking-dot" />
                        <span className="thinking-dot" />
                        <span className="thinking-dot" />
                      </span>
                    )
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p role="alert" className="px-4 pb-2 text-center text-sm text-[var(--critical)]">
          {error}
        </p>
      )}

      {/* Composer */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-end gap-2 rounded-[var(--r-lg)] border border-[var(--border-strong)] bg-surface-2 p-2 focus-within:border-[var(--accent)]"
          >
            <label htmlFor="assistant-input" className="sr-only">
              Message the assistant
            </label>
            <textarea
              id="assistant-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit(input);
                }
              }}
              rows={1}
              placeholder="Ask about your footprint…"
              disabled={enabled === null}
              className="scroll-thin max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            />
            {hasMessages && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
                aria-label="Start a new conversation"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={streaming || enabled === null || input.trim() === ""}
              aria-label="Send message"
              className="size-9 p-0"
            >
              <ArrowUp aria-hidden="true" className="size-4" />
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-fg-subtle">
            Grounded in your logged data · responses may be imprecise
          </p>
        </div>
      </div>
    </div>
  );
}
