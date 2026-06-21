# Architecture

This document explains how Carbon is structured, how data flows through it, and
the engineering decisions behind it. For a product-level overview see the
[README](../README.md); for the security posture see [SECURITY.md](../SECURITY.md).

## Guiding principle

> **The intelligence is deterministic; the AI is a narrator.**

Every figure and recommendation the product shows is produced by pure,
unit-tested TypeScript — not by a language model. The AI assistant receives that
computed analysis as grounded context and only _explains_ it. This makes the
advice reproducible, auditable, testable, and impossible to hallucinate.

## Layered design

```
┌──────────────────────────────────────────────────────────────┐
│ Presentation        src/app/**, src/components/**             │
│   App Router pages + hand-built accessible UI primitives       │
├──────────────────────────────────────────────────────────────┤
│ Application state   src/lib/store/**                           │
│   Zustand store (localStorage-persisted) + Zod validation      │
├──────────────────────────────────────────────────────────────┤
│ Domain logic        src/lib/emissions/**, src/lib/insights/**  │
│   Pure functions: emission factors, calculation, rules engine  │
├──────────────────────────────────────────────────────────────┤
│ Server boundary     src/app/api/**, src/lib/ai/**,             │
│                     src/lib/security/**, src/middleware.ts      │
│   Validation, sanitization, rate limiting, headers, streaming  │
└──────────────────────────────────────────────────────────────┘
```

Dependencies point downward only: the domain layer has **no** dependency on
React, the store, or the network, so it can be reasoned about and tested in
isolation.

## Module responsibilities

| Module | Responsibility | Key invariant |
| --- | --- | --- |
| `lib/emissions/factors.ts` | The single source of truth for emission factors and category metadata. | Every factor carries a cited `source`. |
| `lib/emissions/calculate.ts` | Pure conversion of activities → kg CO2e, summaries, daily totals. | Invalid/unknown activities are dropped, never thrown. |
| `lib/insights/rules.ts` | The deterministic recommendation rules + their helpers. | Savings derive from `factors.ts`, never hardcoded. |
| `lib/insights/analyze.ts` | Orchestrates calculation + rules into a `FootprintAnalysis`. | Output is a pure function of the input activities. |
| `lib/insights/benchmarks.ts` | Reference daily benchmarks for context. | Documented derivation from public estimates. |
| `lib/store/**` | Client state, persistence, and input validation. | Persisted data is re-validated on load. |
| `lib/ai/**` | Server-only inference client, prompt builder, config, rate limiter. | The API key never crosses the server boundary. |
| `lib/security/**` | Header policy and input sanitization. | One header policy, reused by config + middleware. |
| `components/ui/**` | Hand-built, accessible primitives (no UI framework). | WAI-ARIA patterns; keyboard-operable. |

## Data flow

### Logging an activity (fully client-side)

1. The user submits the activity form. Input is validated by a Zod schema
   (`lib/store/helpers.ts`).
2. The activity is saved to the Zustand store and persisted to `localStorage`.
3. The emissions engine converts activities to kg CO2e; the insights engine
   analyses the result into ranked, quantified recommendations.
4. The dashboard renders stats, a semantic-table breakdown chart, and insights.

No network request is involved — the product is fully usable offline and with
the AI layer disabled.

### Asking the assistant (client → server → model)

1. The client POSTs the chat history plus the current activity log to
   `/api/assistant`.
2. The route enforces same-origin, rate limits, validates the body (Zod), and
   sanitizes message text.
3. The footprint is **recomputed server-side** from the activities and injected
   as factual context, so the model narrates the user's real numbers.
4. The completion is streamed back token-by-token from the server-only client,
   with model fallback if the primary model errors before output.

## Key decisions

- **Local-first, no backend database.** Keeps the product private, zero-config,
  and well within repo-size limits. The trade-off (no cross-device sync) is an
  explicit non-goal for this single-user tool.
- **Hand-built UI primitives.** A minimal dependency surface and full control
  over accessibility semantics, at the cost of writing the ARIA patterns
  ourselves (covered by component + axe tests).
- **Rules as data.** The recommendation logic is an ordered array of pure rule
  functions rather than branches in one procedure, so each rule is independently
  testable and the engine is easy to extend.
- **Server-only AI boundary.** All provider interaction is isolated behind
  `server-only` modules so the API key can never reach the client bundle.

## Testing strategy

| Layer | Tooling | What it proves |
| --- | --- | --- |
| Domain + server logic | Vitest | Calculation, rules, validation, sanitization, rate limiting, and the SSE/stream client behave exactly as specified. |
| UI primitives | Vitest + Testing Library | Components render correct semantics and remain keyboard/screen-reader operable. |
| End-to-end + a11y | Playwright + axe-core | Real user flows work and every page is free of WCAG 2.1 A/AA violations. |

Quality gates (`format:check`, `lint`, `typecheck`, `test`, `build`, secret
scan, and the e2e suite) run in CI on every push and pull request.
