# CLAUDE.md

Operational guide for Claude Code on this repo. Every statement is a directive. If something here is wrong, update it.

## What this is

A public, live reference implementation showing developers how to integrate with Warrantini's headless warranty/claims API. It is a real Next.js app that calls Warrantini's public `/v1` REST API server-side and renders both the resulting UI *and* the literal HTTP request/response for each action ("narrated API calls"), so visitors see working integration code, not a mockup.

This repo has NO access to Warrantini's internal codebase, database, or business logic. It is a pure API consumer, exactly like any third-party integrator would be. Do not attempt to shortcut around the public API — that would defeat the purpose of the demo.

## Tech stack

| Concern | Tool |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
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

The live spec (`{WARRANTINI_API_BASE_URL}/api/openapi.json`) has **three distinct tiers** under `/api/v1/*` — don't conflate them:

| Tier | Auth | Scope | Used by |
|---|---|---|---|
| Plain (`/api/v1/orders`, `/registrations`, `/claims`, `/products`, `/rules`) | `Authorization: Bearer <api_key>`, key format `wrnt_(live\|test)_<...>` (`process.env.DEMO_API_KEY`) | Tenant-wide — returns every visitor's data at once | **Warranty Policy page** (`GET /v1/rules`, read-only — this repo's first plain-tier call). Everything else on this tier is still unused |
| Admin (`/api/v1/admin/*`) | Same bearer scheme, admin-scoped key | Warrantini's own internal dashboard (settings, billing, Shopify sync, etc.) | Never — out of scope for this demo entirely |
| Customer (`/api/v1/customer/*`) | OTP-derived customer JWT (`Authorization: Bearer <jwt>`, obtained via `/customer/auth/send-otp` + `/verify-otp`) for most endpoints; `GET .../warranty-policy` is the one public exception — no auth at all | Pre-scoped server-side to one verified customer email (except the public policy endpoint, which is tenant-wide but not customer-specific) | **Registrations list**, **Registration wizard** (orders + registrations), **Warranty Policy page** (published policy overview) |

**The docs URL `.../api/docs#tag/admin-settings` is the *admin* tier's own docs** — its path list (`/api/v1/admin/*`, `/api/v1/internal/*`) is not the integrator-facing surface. Always fetch and parse the raw `openapi.json` directly rather than trusting the rendered Scalar page (it's JS-rendered and won't come through a simple fetch) — and don't trust a single summarized pass over it either; a large spec can lose whole path groups to a lossy summary. Confirm path counts/lists by parsing the JSON directly (e.g. `python3 -c "import json; ..."`) when it matters.

**The API key (`process.env.DEMO_API_KEY`) is a server-only secret — it must never be sent to the browser, imported into client components, or exposed via `NEXT_PUBLIC_*`.** Every call to Warrantini's API happens inside a Next.js Route Handler (`app/api/demo/*`), never client-side. The customer JWT obtained via OTP is equally a live credential and must be handled the same way — server-side only, never returned to the browser in a JSON body (store it in an httpOnly cookie).

Endpoints this demo currently uses (confirmed directly against the live OpenAPI spec — verify again before relying on this if it's been a while, this can drift):

| Resource | Endpoints |
|---|---|
| Customer auth | `POST /api/v1/customer/auth/send-otp`, `POST /api/v1/customer/auth/verify-otp` |
| Customer registrations | `GET /api/v1/customer/registrations`, `GET /api/v1/customer/registrations/{id}`, `POST /api/v1/customer/registrations` |
| Customer orders | `GET /api/v1/customer/orders` (each line item comes pre-enriched with a `coverageStatus` — no local composition against rules/registrations needed) |
| Published warranty policy | `GET /api/v1/customer/warranty-policy?slug=<tenant>` — the one customer-tier endpoint with no auth at all, public by design |
| Warranty rules (plain tier) | `GET /v1/rules` — this repo's first plain-tier call. Rules are shared tenant *policy config*, not per-visitor data, so hard rule 3's demo_activity filtering doesn't apply here (nothing in `/v1/orders\|registrations\|claims\|products`'s "another visitor's data" sense to leak) |

Not yet used, but real and documented in the spec for future features: plain-tier `POST/GET /v1/orders`, `POST/GET /v1/registrations`, `POST /v1/registrations/{id}/void`, `POST/GET /v1/claims`, `GET /v1/claims/{id}`, `POST /v1/claims/{id}/transition`, `POST /v1/claims/{id}/attachments`, `GET /v1/products`; customer-tier `POST/GET /api/v1/customer/claims`.

Scopes on the plain-tier demo key are minimal: `orders:read`, `registrations:read`, `registrations:write`, `claims:read`, `claims:write`, `rules:read`, `products:read`. Do not request or assume broader scopes. The customer tier doesn't use API-key scopes at all — it's gated by the OTP-derived JWT instead.

Conventions to expect (confirm against the live spec, don't hardcode without checking):
- Plain tier: cursor-based pagination (`cursor`/`limit`) on list endpoints. Customer tier: page-based pagination (`page`/`pageSize`) instead — don't assume one convention applies to both.
- `Idempotency-Key` header supported on write endpoints.
- **Error shape differs by tier** — verify per-endpoint, don't assume one shape: the plain tier returns RFC 7807 Problem Details (`{ type, title, status, detail, errors? }`, `application/problem+json`); the customer tier returns `{ error, message[, statusCode] }` instead.
- The API is rate-limited per key. Because this demo's key is **shared across every visitor to this site**, this repo must add its OWN, tighter per-IP/per-session rate limiting on top (see Hard Rules) — never rely solely on the upstream limit.

**Source of truth**: the raw OpenAPI JSON at `{WARRANTINI_API_BASE_URL}/api/openapi.json`. Before writing or changing any integration code, fetch and parse it directly rather than trusting this file's endpoint list (which can go stale) or a summarized read of the spec (which can silently drop whole path groups).

## Database schema

This repo's database NEVER stores warranty/claims/order/registration data — that always lives in Warrantini's system and is fetched live. This repo's schema only tracks facts about its own visitors:

- **`demo_users`** — `id`, `clerk_user_id` (unique), `email`, `created_at`. Populated by a Clerk `user.created`/`user.deleted` webhook.
- **`demo_activity`** — `id`, `user_id` (nullable FK → `demo_users`), `anon_session_id` (nullable, for visitors who never sign in), `entity_type` (`registration` | `claim`), `entity_id` (text — the ID Warrantini's API returned), `created_at`. Append-only. This is what scopes "my registrations/claims" **when talking to the plain tier** — its list endpoints return the whole shared demo tenant's data, so the UI must filter by this table rather than trusting the raw response. **Not needed when talking to the customer tier** (`/api/v1/customer/*`) — that tier is already scoped server-side to one verified customer email via the OTP-derived JWT, so hard rule 3 doesn't apply to it. Not yet built as of the registrations-list feature (customer-tier only, no plain-tier calls yet).
- **`demo_request_log`** (optional, signed-in users only) — persisted narrated API-call history. Anonymous visitors keep this client-side only (lost on refresh) to avoid a DB write per anonymous click.

Migrations via Drizzle Kit, committed to `drizzle/`. No raw SQL outside the Drizzle schema.

## Clerk auth — how it works here

- A dedicated Clerk application for this site — not shared with any other product.
- No Organizations — single-user identities only.
- Sign-in is **optional** and never blocks core functionality:
  - Anonymous visitors get full access to every demo flow, scoped by an httpOnly `demo_session_id` cookie.
  - Signing in re-keys `demo_activity`/`demo_request_log` rows to `clerk_user_id` instead, so history persists across devices, and captures an email as a lead.
- `clerkMiddleware()` (in `proxy.ts` — Next.js 16 renamed the middleware-file convention from `middleware.ts`) runs broadly but permissively — only `/account` (and similar identity-requiring routes) call `auth.protect()`. `/demo/*`, `/`, `/docs`, `/registrations`, `/claims` stay open to anonymous visitors. Note: `/registrations` has its own, separate OTP-based identity gate (Warrantini's customer-auth tier) — that's a required part of that flow, not Clerk gating, and doesn't violate this rule.
- Clerk webhook at `/api/webhooks/clerk`, Svix-signature-verified, on `user.created`/`user.deleted`, keeps `demo_users` in sync.
- **Do not** wire Clerk sign-in into provisioning a real account on the main Warrantini product. That is a distinct, bigger feature (calling Warrantini's own signup/billing flow) and is explicitly out of scope unless a future decision says otherwise.

## Repo structure

**No `src/` prefix — layout is root-level `app/`, `lib/`, `components/`.**

```
/ ├── app/
  │   ├── api/demo/*            ← server-side proxy Route Handlers to Warrantini /v1 (hold DEMO_API_KEY / customer JWT)
  │   ├── api/webhooks/clerk/   ← Clerk user.created/deleted sync → demo_users
  │   ├── registrations/        ← "My Registrations" (customer-tier, OTP-gated)
  │   ├── sign-in/, sign-up/    ← Clerk hosted widgets
  │   └── account/              ← Clerk-gated: saved history, sign-out
  ├── lib/
  │   ├── warrantini-client.ts  ← instrumented fetch wrapper: auth injection + request/response capture for the narrated log
  │   ├── rate-limit.ts         ← Upstash-backed per-IP / per-email throttle
  │   ├── customer-session.ts   ← httpOnly cookie helpers for the customer JWT
  │   ├── db.ts                 ← Drizzle client (not yet wired — no plain-tier/demo_activity feature built yet)
  │   └── registration-status.ts ← status → badge/coverage-bar presentation mapping
  ├── drizzle/                   ← schema.ts + generated migrations (not yet created)
  ├── components/ui/             ← shadcn/ui primitives
  ├── components/registrations/  ← registrations-list feature components
  └── proxy.ts                   ← clerkMiddleware (Next 16's middleware-file convention)
```


## Environment variables

Document every env var here before code references it:

| Var | Purpose |
|---|---|
| `WARRANTINI_API_BASE_URL` | Base URL of Warrantini's public API |
| `DEMO_API_KEY` | Server-only bearer key for the shared demo tenant's plain tier — never exposed client-side. Used by the Warranty Policy page's `GET /v1/rules` call; not needed by any customer-tier feature (those use the OTP-derived JWT, or no auth at all for the public policy endpoint) |
| `WARRANTINI_TENANT_SLUG` | Server-only tenant slug required in the customer-tier OTP request bodies (`send-otp`/`verify-otp`) |
| `DATABASE_URL` | This repo's own Neon Postgres connection string |
| `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | This repo's own, separate Clerk application |
| `CLERK_WEBHOOK_SECRET` | Svix signing secret for the Clerk webhook |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Route paths for Clerk's sign-in/sign-up pages (`/sign-in`, `/sign-up`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | Where Clerk redirects after sign-in/sign-up if no other redirect is specified (`/`) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting / session cache |
| `SENTRY_DSN` | Error monitoring |
| `NEXT_PUBLIC_POSTHOG_KEY` (optional) | Analytics |

## The "narrated API call" feature

Every demo action screen is a split pane: the actual UI control on one side, a live request/response console on the other (method, path, request body, response status/body, latency). The `Authorization` header is always rendered redacted (a fixed placeholder like `Bearer ••••••••`, never a real prefix/suffix of the credential), never the real value. Include a "copy as curl" / "copy as fetch" action per log entry — build these from the already-redacted narration entry only, never from anything that touched the real header, so a real bearer token (API key or customer JWT) can't end up in a visitor's clipboard. This applies to any secret embedded in a response body too (e.g. the customer-tier `verify-otp` response's JWT) — redact it in the narration entry itself, not just in the JSON the browser uses for app logic. This is the core feature — it's what makes the site read as a working code sample instead of a polished mockup. Each Route Handler under `app/api/demo/*` should be a thin, honest 1:1 mirror of one upstream endpoint so what's logged is a real trace of a real call, not a client-authored guess (a local-only helper with no upstream equivalent, like a session logout, is a documented exception).

## Hard rules

1. `DEMO_API_KEY` (and, equally, any customer-tier JWT obtained via OTP) is used ONLY inside server-side Route Handlers under `app/api/demo/*`. Never in client components, never as `NEXT_PUBLIC_*`, never logged or returned to the browser in full (only a fixed redaction placeholder) — this includes inside narration entries and any credential embedded in a response body (e.g. `verify-otp`'s `token`).
2. Every write action must be scoped to something the current visitor (by `clerk_user_id` or `anon_session_id`) actually created, per `demo_activity`. Never allow mutating seed data or another visitor's rows.
3. Never render a raw response from a **plain-tier** shared-tenant list endpoint (`GET /v1/orders|registrations|claims|products`) directly — always filter to the current visitor's own activity plus the static seed set before display. This rule doesn't apply to the **customer tier** (`/api/v1/customer/*`) — Warrantini already scopes those responses server-side to one verified customer email via the OTP-derived JWT, so there's no shared-tenant data to filter.
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
