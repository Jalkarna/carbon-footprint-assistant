# Security Policy

Carbon is a personal carbon-footprint tracker. This document describes the
security posture of the application and how to report issues.

## Reporting a vulnerability

If you discover a security vulnerability, please report it privately by opening
a [GitHub security advisory](https://github.com/Jalkarna/carbon-footprint-assistant/security/advisories/new)
rather than a public issue. We aim to acknowledge reports within 72 hours.

Please include:

- A description of the issue and its impact.
- Steps to reproduce (a proof of concept is appreciated).
- Any suggested remediation.

## Scope

In scope:

- The Next.js application and its API route (`/api/assistant`).
- Client-side data handling and storage.
- The AI integration layer.

Out of scope:

- The upstream DigitalOcean inference provider.
- Denial-of-service via volumetric traffic (handled at the platform edge).

## Security design

### Secret handling

- The AI provider API key is read **only** server-side, from the
  `DO_INFERENCE_API_KEY` environment variable, inside modules guarded by the
  `server-only` package. It is never serialized into the client bundle, never
  sent to the browser, and never logged. The `/api/assistant` GET probe returns
  only a boolean `enabled` flag.
- A unit test asserts the key cannot leak through the public capability probe.

### Transport and headers

A single source of truth (`src/lib/security/headers.ts`) defines the security
headers, applied in both `next.config.ts` and `middleware.ts`:

- `Content-Security-Policy` — `default-src 'self'`; `connect-src 'self'` so the
  browser only ever talks to our own origin.
- `Strict-Transport-Security` with a two-year max-age and preload.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `frame-ancestors 'none'` to prevent clickjacking and MIME sniffing.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- A restrictive `Permissions-Policy` disabling camera, microphone, geolocation,
  payment, and USB.
- `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy` set to
  `same-origin`.

### Input validation and sanitization

- Every API request body is validated with a strict [Zod](https://zod.dev)
  schema: bounded array lengths, enum-constrained roles, and per-message length
  limits.
- User message content is sanitized (`src/lib/security/sanitize.ts`): Unicode
  normalization, removal of control and zero-width / bidirectional-override
  characters, and length clamping. This reduces prompt-injection obfuscation.
- Emission-factor IDs are validated against a closed allow-list; unknown
  factors are rejected.

### Abuse protection

- A fixed-window in-memory rate limiter bounds requests per client IP.
- Middleware rejects oversized request bodies (`413`) before they reach the
  handler.
- The API enforces same-origin requests (`403` on cross-origin), a lightweight
  CSRF defense for this credential-free endpoint.

### Prompt safety

- The system prompt constrains the assistant to the user's real, computed
  footprint and forbids inventing figures or revealing its instructions.
- Conversation history is clamped in both message count and per-message length
  before being sent to the model.

### Data privacy

- The activity log is stored locally in the browser (`localStorage`). There is
  no account system and no analytics. Data leaves the device only when the user
  explicitly sends a message to the assistant.

## Dependencies

Dependencies are pinned in `package.json` and audited with `npm audit`. We
prefer a minimal dependency surface; the UI component library is hand-built
rather than pulled from third parties.
