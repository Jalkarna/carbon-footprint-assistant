"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/ai/prompt";
import type { Activity } from "@/lib/emissions/types";
import { useCarbonStore } from "@/lib/store/carbon-store";
import { useToast } from "@/components/ui";
import { getFactor } from "@/lib/emissions/factors";

export type ChatStatus = "idle" | "streaming" | "error";

export interface UseAssistantChat {
  messages: ChatMessage[];
  status: ChatStatus;
  enabled: boolean | null;
  error: string | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

/** Regex that matches [LOG_ACTIVITY:{...}] markers anywhere in text. */
const LOG_ACTIVITY_RE = /\[LOG_ACTIVITY:(\{[^}]+\})\]/g;

/**
 * Strip any [LOG_ACTIVITY:{...}] markers from text and return both the cleaned
 * text and the list of raw JSON payloads found.
 */
function extractLogMarkers(text: string): {
  clean: string;
  payloads: string[];
} {
  const payloads: string[] = [];
  const clean = text.replace(LOG_ACTIVITY_RE, (_, json: string) => {
    payloads.push(json);
    return "";
  }).trim();
  return { clean, payloads };
}

/**
 * Encapsulates the assistant conversation: capability probe, optimistic message
 * append, streaming read of the response body, and error handling. Keeping this
 * in a hook makes the chat UI thin and the behaviour unit-testable.
 *
 * After streaming completes the hook parses any [LOG_ACTIVITY:{...}] markers
 * the model may have appended, logs the activities via the carbon store, strips
 * the markers from the displayed message, and fires a toast per activity.
 */
export function useAssistantChat(
  getActivities: () => Activity[],
): UseAssistantChat {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activitiesRef = useRef(getActivities);
  useEffect(() => {
    activitiesRef.current = getActivities;
  }, [getActivities]);

  const addActivity = useCarbonStore((s) => s.addActivity);
  const { toast } = useToast();

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

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
    setStatus("idle");
  }, []);

  // Keep a ref to messages so `send` can read the latest without re-creating.
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setError(null);
    setStatus("streaming");

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const assistantMsg: ChatMessage = { role: "assistant", content: "" };

    // Optimistically add both the user message and an empty assistant message (thinking state)
    const nextWithAssistant = [...messagesRef.current, userMsg, assistantMsg];
    setMessages(nextWithAssistant);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messagesRef.current, userMsg],
          activities: activitiesRef.current(),
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "The assistant is unavailable.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant") {
            copy[copy.length - 1] = {
              role: "assistant",
              content: last.content + chunk,
            };
          }
          return copy;
        });
      }

      // Once the stream is finished, process any [LOG_ACTIVITY:{...}] markers.
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role !== "assistant") return m;

        const { clean, payloads } = extractLogMarkers(last.content);

        for (const json of payloads) {
          try {
            const parsed = JSON.parse(json) as {
              factorId?: unknown;
              quantity?: unknown;
              date?: unknown;
            };
            const factorId =
              typeof parsed.factorId === "string" ? parsed.factorId : null;
            const quantity =
              typeof parsed.quantity === "number" ? parsed.quantity : null;
            const date =
              typeof parsed.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)
                ? parsed.date
                : null;

            if (!factorId || quantity === null || !date) {
              toast("Assistant tried to log an activity but the data was incomplete.", "error");
              continue;
            }

            if (!getFactor(factorId)) {
              toast(`Assistant suggested an unknown activity type: ${factorId}.`, "error");
              continue;
            }

            const result = addActivity({ factorId, quantity, date });
            if (result.ok) {
              const factor = getFactor(factorId);
              toast(
                `Logged ${quantity} ${factor?.unit ?? "unit"} of ${factor?.label ?? factorId}.`,
                "success",
              );
            } else {
              toast(`Could not log activity: ${result.error}`, "error");
            }
          } catch {
            toast("Assistant tried to log an activity but the format was invalid.", "error");
          }
        }

        copy[copy.length - 1] = { role: "assistant", content: clean };
        return copy;
      });

      setStatus("idle");
    } catch (err) {
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          return copy.slice(0, -1);
        }
        return m;
      });
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }, [addActivity, toast]);

  return { messages, status, enabled, error, send, reset };
}
