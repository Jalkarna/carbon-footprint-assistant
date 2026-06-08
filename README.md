# Carbon — understand, track, and shrink your footprint

A personal carbon-footprint assistant. Log everyday activities — trips, meals,
home energy, shopping — and get an instant, **quantified** breakdown of your
emissions plus **personalized, logical recommendations**. A built-in AI
assistant answers questions about your footprint, grounded in your real data.

> **Chosen vertical:** the **Everyday Individual** — one person tracking their
> footprint across all the major categories of daily life. This vertical was
> chosen because it exercises the full breadth of the problem (transport,
> energy, diet, shopping) and gives the assistant the richest context to
> personalize its advice.

---

## Table of contents

- [What it does](#what-it-does)
- [How the solution works](#how-the-solution-works)
- [Approach and logic](#approach-and-logic)
- [Architecture](#architecture)
- [Running locally](#running-locally)
- [The AI assistant (optional)](#the-ai-assistant-optional)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Security](#security)
- [Assumptions](#assumptions)
- [Project structure](#project-structure)

---

## What it does

- **Log activities** in natural units (km driven, kWh used, meals eaten, items
  bought) across four categories: transport, home energy, diet, and shopping.
- **See your footprint** as a total, a daily average, and a per-category
  breakdown — with every number traceable to a cited emission factor.
- **Get personalized insights** — a deterministic rules engine identifies your
  biggest sources and proposes concrete, **quantified** swaps ("swap 3 red-meat
  meals → save ~14 kg CO₂e").
- **Compare** your daily average to the global average and a climate-friendly
  target so the number actually means something.
- **Set a daily goal** and track progress toward it.
- **Ask the assistant** open questions ("what's my biggest source?", "give me
  three ways to cut down") and get answers grounded in your logged data.

Everything is stored locally in your browser — no account, no backend database.

---

## How the solution works

```
            ┌─────────────────────────────────────────────┐
            │            Your browser (client)             │
            │                                              │
  log  ───► │  Zustand store  ──►  Emissions engine        │
            │  (localStorage)       (pure, cited factors)  │
            │        │                     │               │
            │        │                     ▼               │
            │        │              Insights engine        │
            │        │           (deterministic rules)     │
            │        │                     │               │
            │        ▼                     ▼               │
            │   Accessible dashboard: stats, breakdown,    │
            │   insights, activity log, assistant chat     │
            └───────────────────────┬──────────────────────┘
                                     │  POST activities + chat
                                     ▼
            ┌─────────────────────────────────────────────┐
            │      /api/assistant  (Next.js, server)       │
            │                                              │
            │  1. validate (zod) + rate-limit              │
            │  2. recompute footprint deterministically    │
            │  3. build a grounded context block           │
            │  4. stream completion from DigitalOcean      │
            │     Gradient inference (key stays server)    │
            └─────────────────────────────────────────────┘
```

1. You log an activity. It is validated and saved to a Zustand store persisted
   in `localStorage`.
2. The **emissions engine** converts each activity to kg CO₂e using documented
   emission factors.
3. The **insights engine** analyses the result and produces ranked, quantified
   recommendations — pure functions, no AI required.
4. The dashboard renders the stats, a breakdown chart, and the insights.
5. When you chat, your activities are sent to a server route that recomputes the
   footprint, **injects it as factual context**, and streams a reply from the
   language model. The model narrates *your* numbers — it never invents them.

---

## Approach and logic

The core principle: **the intelligence is deterministic; the AI is a narrator.**

- **Logical decision-making lives in code, not the prompt.** All figures and
  recommendations come from pure, unit-tested functions
  (`src/lib/emissions`, `src/lib/insights`). This makes the advice
  reproducible, auditable, and testable.
- **Context-driven recommendations.** The insights engine inspects your actual
  activities — how many red-meat meals, how many car-km, how much electricity —
  and fires rules with concrete savings, ranked by impact. Example rules:
  - High red-meat diet → suggest swaps, quantified by the factor difference.
  - Significant petrol-car distance → suggest a mode shift to rail/bus.
  - High home-energy use → efficiency nudge with a ~15% estimate.
  - Lots of walking / cycling / rail → recognised as a **win**.
- **Grounded AI.** The assistant receives a `FOOTPRINT CONTEXT` block built from
  the deterministic analysis and a strict system prompt that keeps it on-topic
  and honest. If the AI is unconfigured or unavailable, the app degrades
  gracefully — the full dashboard still works.

---

## Architecture

| Layer | Technology | Why |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router) | Server routes keep the AI key off the client; great DX and deploy story. |
| Language | **TypeScript** (strict) | Type-safe domain model end to end. |
| State | **Zustand** + `persist` | Tiny, testable store with local persistence; no backend needed. |
| Validation | **Zod** | One schema shared by the store and the API route. |
| Styling | **Tailwind CSS v4** | Token-driven, accessible theming with light/dark support. |
| AI | **DigitalOcean Gradient** (OpenAI-compatible) | Streaming completions with server-side model fallback. |
| Unit/Component tests | **Vitest** + Testing Library | Fast, jsdom-based. |
| E2E + a11y tests | **Playwright** + **axe-core** | Real browser flows with automated accessibility scans. |

---

## Running locally

Requires Node.js 22+.

```bash
npm install
npm run dev          # http://localhost:3000
```

The app is fully functional out of the box (the AI assistant is optional — see
below).

Useful scripts:

```bash
npm run build        # production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # unit + component tests (Vitest)
npm run test:coverage
npm run test:e2e     # Playwright e2e + axe accessibility scans
```

---

## The AI assistant (optional)

The assistant uses DigitalOcean's OpenAI-compatible Gradient inference endpoint.
It is **optional** — without a key, the dashboard and all insights still work,
and the chat panel shows a clear notice.

To enable it, copy `.env.example` to `.env.local` and set:

```bash
DO_INFERENCE_API_KEY=sk-do-...        # read server-side ONLY
# optional overrides:
# DO_INFERENCE_BASE_URL=https://inference.do-ai.run/v1
# DO_INFERENCE_MODEL=llama3.3-70b-instruct
```

Key handling:

- The key is read **only** in server code (`src/lib/ai/*`, guarded by
  `server-only`) and used in the `/api/assistant` route.
- It is **never** prefixed with `NEXT_PUBLIC_`, so it is never bundled into
  client JavaScript. The browser only ever talks to our own `/api/assistant`.
- The client requests are validated, rate-limited, and the response is streamed.

On Vercel, set `DO_INFERENCE_API_KEY` as an encrypted environment variable
(Production + Preview). It is injected at runtime and stays server-side.

---

## Testing

Three layers, all runnable in CI (see `.github/workflows/ci.yml`):

1. **Unit tests** — the emissions engine, insights engine, store, validation,
   AI prompt builder, SSE stream parser, and rate limiter. The decision logic is
   covered exhaustively because it is where correctness matters most.
2. **Component tests** — the activity form (validation, live-region feedback,
   dynamic units), the breakdown chart (semantic table), and the insight list.
3. **End-to-end + accessibility** — Playwright drives real user flows (log →
   see breakdown → persist across reload → remove) and runs **axe-core**
   accessibility scans on both the empty and populated dashboard, asserting
   **zero** WCAG 2 A/AA violations.

```bash
npm run test         # 70+ unit/component tests
npm run test:e2e     # 6 e2e specs incl. 2 axe scans
```

---

## Accessibility

Accessibility was designed in, not bolted on:

- **Semantic structure** — one `<h1>`, sectioned headings, landmarks
  (`header`/`main`/`footer`), and a **skip-to-content** link.
- **Forms** — every control has an associated `<label>`; hints and errors are
  wired with `aria-describedby`; errors use `role="alert"`; successful logging
  is announced via a polite live region.
- **The breakdown chart is a semantic `<table>`** with a caption and row
  headers, so it is fully meaningful to screen readers and works without CSS.
  Colour is never the only signal — every value is also text.
- **The assistant transcript** is an `aria-live` log; each message is prefixed
  for screen readers with who is speaking.
- **Keyboard** — everything is operable by keyboard with a strong, always-
  visible `:focus-visible` indicator.
- **Contrast** — colour tokens meet WCAG AA against their surfaces in both light
  and dark themes.
- **Reduced motion** — animations are disabled under
  `prefers-reduced-motion: reduce`.

> Automated scans (axe-core) catch a meaningful subset of issues. Full WCAG
> conformance also requires manual testing with assistive technology; the
> automated suite here asserts no detectable A/AA violations.

---

## Security

- **Secrets never reach the client.** The inference key is server-only and
  excluded from the client bundle (verified). The browser talks only to
  `/api/assistant`.
- **Input validation** with Zod on both the store and the API route; unknown
  factors, bad numbers, and oversized payloads are rejected.
- **Rate limiting** on the AI route to bound abuse.
- **Strict security headers** (`next.config.ts`): a tight Content-Security-
  Policy (`connect-src 'self'`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, a locked-down `Permissions-Policy`, and the
  `X-Powered-By` header removed.
- **Prompt-injection surface is bounded** — chat history is length- and
  count-clamped, and the system prompt forbids contradicting the computed data
  or revealing instructions.

---

## Assumptions

- **Emission factors are representative public estimates** (UK DEFRA/DESNZ 2024,
  US EPA, and Poore & Nemecek 2018 for diet), rounded for clarity. This is an
  **educational guide, not a certified carbon audit**. Each factor carries a
  `source` field in `src/lib/emissions/factors.ts`.
- **Single-user, local-first.** Data lives in the browser's `localStorage`;
  there is no account system or shared database. This keeps the app private,
  zero-config, and well within the repo/size constraints.
- **The "daily average"** divides the total by the number of distinct days the
  user actually logged, not by calendar days, so sparse logging is not unfairly
  penalised.
- **The in-memory rate limiter** is per-instance, which suits a single-instance
  demo deployment; a multi-instance production setup would use a shared store.
- **The AI layer is optional.** The product is fully usable without it.

---

## Project structure

```
src/
  app/
    layout.tsx              # root layout, metadata, skip link
    page.tsx                # the dashboard
    api/assistant/route.ts  # server-side AI endpoint (validation, rate limit, stream)
  components/               # accessible UI (form, chart, insights, assistant, cards)
  lib/
    emissions/              # cited factors + pure calculation (the source of truth)
    insights/               # deterministic analysis & recommendation rules
    store/                  # Zustand store + Zod validation + helpers
    ai/                     # server-only inference client, prompt builder, rate limiter
e2e/                        # Playwright specs incl. axe accessibility scans
```

---

Built as a demonstration of a smart, dynamic, context-aware assistant with
clean code, real tests, and accessibility as a first-class concern.
