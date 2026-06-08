/**
 * Server-side configuration for the AI assistant.
 *
 * The DigitalOcean Gradient inference endpoint is OpenAI-compatible. The API
 * key is read from the environment and MUST never be exposed to the client —
 * every consumer of this module runs on the server (the API route).
 */

/** Ordered fallback models. If one is unavailable we try the next. */
export const FALLBACK_MODELS: readonly string[] = [
  "llama3.3-70b-instruct",
  "deepseek-3.2",
  "alibaba-qwen3-32b",
  "openai-gpt-oss-120b",
  "router:general",
];

export interface AIConfig {
  baseURL: string;
  apiKey: string;
  models: readonly string[];
  timeoutMs: number;
}

/**
 * Resolve AI configuration from environment variables.
 *
 * Returns `null` when no API key is configured so callers can degrade
 * gracefully (the app still works fully without the AI layer — the rules
 * engine provides all core insights).
 */
export function getAIConfig(): AIConfig | null {
  const apiKey = process.env.DO_INFERENCE_API_KEY?.trim();
  if (!apiKey) return null;

  const baseURL = (
    process.env.DO_INFERENCE_BASE_URL?.trim() || "https://inference.do-ai.run/v1"
  ).replace(/\/$/, "");

  const envModel = process.env.DO_INFERENCE_MODEL?.trim();
  const models = envModel
    ? [envModel, ...FALLBACK_MODELS.filter((m) => m !== envModel)]
    : FALLBACK_MODELS;

  return {
    baseURL,
    apiKey,
    models,
    timeoutMs: Number(process.env.DO_INFERENCE_TIMEOUT_MS) || 30_000,
  };
}

/** Whether the AI layer is configured and available. */
export function isAIEnabled(): boolean {
  return getAIConfig() !== null;
}
