# CLAUDE.md

Operational guide for Claude Code on this repo. Every statement is a directive. If something here is wrong, update it.

## What this is

A public, live reference implementation showing developers how to integrate with Warrantini's headless warranty/claims API. It is a real Next.js app that calls Warrantini's public `/v1` REST API server-side and renders both the resulting UI *and* the literal HTTP request/response for each action ("narrated API calls"), so visitors see working integration code, not a mockup.

This repo has NO access to Warrantini's internal codebase, database, or business logic. It is a pure API consumer, exactly like any third-party integrator would be. Do not attempt to shortcut around the public API — that would defeat the purpose of the demo.

## Tech stack

| Concern | Tool |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Hosting | Vercel |
| Styling | Tailwind CSS v4 + shadcn/ui (components copied into `components/ui/`, no component-library npm dependency) |
| Auth | Clerk — optional sign-in only, gates persistence/lead-capture, never gates core demo flows |
| Database | Neon Postgres + Drizzle ORM |
| Rate limiting / session cache | Upstash Redis |
| Bot protection | Vercel BotID or Cloudflare Turnstile — write actions only |
| Monitoring | Sentry |
| Analytics | PostHog (optional) |
| Icons | Lucide |
| Dates | date-fns |

## The API this integrates with

Base URL: `process.env.WARRANTINI_API_BASE_URL` (e.g. `https://api.warrantini.com`).

Auth: `Authorization: Bearer <api_key>`, where the key format is `wrnt_(live|test)_<...>`. **The API key (`process.env.DEMO_API_KEY`) is a server-only secret — it must never be sent to the browser, imported into client components, or exposed via `NEXT_PUBLIC_*`.** Every call to Warrantini's API happens inside a Next.js Route Handler (`src/app/api/demo/*`), never client-side.

Known endpoints this demo uses (verify current shape against Warrantini's live OpenAPI spec — see "Source of truth" below, do not assume this list is exhaustive or that request/response bodies below are final):

| Resource | Endpoints |
|---|---|
| Orders | `GET /v1/orders`, `GET /v1/orders/{id}` |
| Registrations | `POST /v1/registrations`, `GET /v1/registrations`, `GET /v1/registrations/{id}`, `POST /v1/registrations/{id}/void` |
| Claims | `POST /v1/claims`, `GET /v1/claims`, `GET /v1/claims/{id}`, `POST /v1/claims/{id}/transition`, `POST /v1/claims/{id}/attachments` |
| Products | `GET /v1/products`, `GET /v1/products/{id}` |
| Warranty rules | `GET /v1/rules`, `GET /v1/rules/{id}` |

Scopes on the demo key are minimal: `orders:read`, `registrations:read`, `registrations:write`, `claims:read`, `claims:write`, `rules:read`, `products:read`. Do not request or assume broader scopes.

Conventions to expect (confirm against the live spec, don't hardcode without checking):
- Cursor-based pagination on list endpoints.
- `Idempotency-Key` header supported on write endpoints.
- Error responses shaped roughly as `{ error, message, statusCode }` — check the actual response before parsing assumptions into typed code.
- The API is rate-limited per key. Because this demo's key is **shared across every visitor to this site**, this repo must add its OWN, tighter per-IP/per-session rate limiting on top (see Hard Rules) — never rely solely on the upstream limit.

**Source of truth**: Warrantini publishes an OpenAPI spec and Scalar-rendered docs. Before writing or changing any integration code, check the live spec/docs rather than trusting this file's endpoint list, which can go stale. [Fill in the actual docs URL once you have it, e.g. `https://api.warrantini.com/api/docs`.]

## Database schema

This repo's database NEVER stores warranty/claims/order/registration data — that always lives in Warrantini's system and is fetched live. This repo's schema only tracks facts about its own visitors:

- **`demo_users`** — `id`, `clerk_user_id` (unique), `email`, `created_at`. Populated by a Clerk `user.created`/`user.deleted` webhook.
- **`demo_activity`** — `id`, `user_id` (nullable FK → `demo_users`), `anon_session_id` (nullable, for visitors who never sign in), `entity_type` (`registration` | `claim`), `entity_id` (text — the ID Warrantini's API returned), `created_at`. Append-only. This is what scopes "my registrations/claims" — the public list endpoints return the whole shared demo tenant's data, so the UI filters by this table, never by trusting the raw API response.
- **`demo_request_log`** (optional, signed-in users only) — persisted narrated API-call history. Anonymous visitors keep this client-side only (lost on refresh) to avoid a DB write per anonymous click.

Migrations via Drizzle Kit, committed to `drizzle/`. No raw SQL outside the Drizzle schema.

## Clerk auth — how it works here

- A dedicated Clerk application for this site — not shared with any other product.
- No Organizations — single-user identities only.
- Sign-in is **optional** and never blocks core functionality:
  - Anonymous visitors get full access to every demo flow, scoped by an httpOnly `demo_session_id` cookie.
  - Signing in re-keys `demo_activity`/`demo_request_log` rows to `clerk_user_id` instead, so history persists across devices, and captures an email as a lead.
- `clerkMiddleware()` runs broadly but permissively — only `/account` (and similar identity-requiring routes) call `auth.protect()`. `/demo/*`, `/`, `/docs` stay open to anonymous visitors.
- Clerk webhook at `/api/webhooks/clerk`, Svix-signature-verified, on `user.created`/`user.deleted`, keeps `demo_users` in sync.
- **Do not** wire Clerk sign-in into provisioning a real account on the main Warrantini product. That is a distinct, bigger feature (calling Warrantini's own signup/billing flow) and is explicitly out of scope unless a future decision says otherwise.

## Repo structure
/ ├── src/app/ │ ├── api/demo/* ← server-side proxy Route Handlers to Warrantini /v1 (hold DEMO_API_KEY) │ ├── api/webhooks/clerk/ ← Clerk user.created/deleted sync → demo_users │ ├── (marketing)/ ← "/" positioning page, "/docs" │ ├── demo/ ← flow picker + split-pane flow screens │ └── account/ ← Clerk-gated: saved history, sign-out ├── src/lib/ │ ├── warrantini-client.ts ← instrumented fetch wrapper: key injection + request/response capture for the narrated log │ ├── db.ts ← Drizzle client │ └── rate-limit.ts ← Upstash-backed per-IP / per-user throttle ├── drizzle/ ← schema.ts + generated migrations ├── src/components/ ← shadcn/ui └── middleware.ts ← clerkMiddleware


## Environment variables

Document every env var here before code references it:

| Var | Purpose |
|---|---|
| `WARRANTINI_API_BASE_URL` | Base URL of Warrantini's public API |
| `DEMO_API_KEY` | Server-only bearer key for the shared demo tenant — never exposed client-side |
| `DATABASE_URL` | This repo's own Neon Postgres connection string |
| `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | This repo's own, separate Clerk application |
| `CLERK_WEBHOOK_SECRET` | Svix signing secret for the Clerk webhook |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting / session cache |
| `SENTRY_DSN` | Error monitoring |
| `NEXT_PUBLIC_POSTHOG_KEY` (optional) | Analytics |

## The "narrated API call" feature

Every demo action screen is a split pane: the actual UI control on one side, a live request/response console on the other (method, path, request body, response status/body, latency). The `Authorization` header is always rendered redacted (`Bearer wrnt_test_••••••••`), never the real value. Include a "copy as curl" / "copy as fetch" action per log entry. This is the core feature — it's what makes the site read as a working code sample instead of a polished mockup. Each Route Handler under `src/app/api/demo/*` should be a thin, honest 1:1 mirror of one upstream endpoint so what's logged is a real trace of a real call, not a client-authored guess.

## Hard rules

1. `DEMO_API_KEY` is used ONLY inside server-side Route Handlers under `src/app/api/demo/*`. Never in client components, never as `NEXT_PUBLIC_*`, never logged in full (only the redacted prefix).
2. Every write action must be scoped to something the current visitor (by `clerk_user_id` or `anon_session_id`) actually created, per `demo_activity`. Never allow mutating seed data or another visitor's rows.
3. Never render a raw response from a shared-tenant list endpoint (`GET /v1/orders|registrations|claims|products`) directly — always filter to the current visitor's own activity plus the static seed set before display.
4. Rate-limit at this repo's own layer (per-IP, per-session) in addition to whatever the upstream API key enforces — the key's budget is shared across every visitor to this site.
5. This repo never stores warranty/claims/order/registration data locally. If you find yourself adding a table that mirrors one of Warrantini's own entities, stop — fetch it live instead.
6. Sign-in via Clerk never gates core demo flows. If a flow only works when signed in, that's a bug, not a feature.
7. Every environment variable is documented in this file (and `.env.example`) before code references it.
8. Treat Warrantini's live OpenAPI/docs as the source of truth for request/response shapes, not this file's endpoint table — update the table here when it drifts, but verify against the real spec first.

## Deferred decisions

| Decision | Trigger |
|---|---|
| Clerk sign-in → real Warrantini trial provisioning | A deliberate decision to turn this into a signup funnel, not a default extension of the demo |
| Headless CMS for content | Page/content volume grows past what's comfortable hardcoded |
| Persisting anonymous visitors' request logs | Only if analytics show anonymous drop-off is a problem worth solving with a DB write per click |
