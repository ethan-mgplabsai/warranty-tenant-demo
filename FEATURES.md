# Feature Roadmap

This breaks the customer-portal prototype (`design/portal-customer.html`) into independent chunks, each scoped
so it can be handed to its own Claude Code session. Every session should read `CLAUDE.md` first (hard rules,
endpoint table, env vars) and `design/branding-book.html` for the Pergola Cave visual identity — the prototype
itself is placeholder-branded as "Trail Supply Co." and needs reskinning, not copying verbatim.

## Done

- **Shared shell + landing page** — `app/layout.tsx` (Pergola Cave header/nav/footer, Inter + JetBrains Mono
  fonts), `app/globals.css` (Pergola Cave theme tokens), `app/page.tsx` (landing screen: hero, welcome copy,
  Register a Product / Warranty Policy action cards, Need Help contact card). Mirrors
  `design/portal-customer.html:1905-1957`.

## Up next

### 1. Auth shell
- **Prototype reference:** `design/portal-customer.html:905-978` (email sign-in + OTP pages).
- **Reality check:** this repo uses Clerk for optional sign-in (see CLAUDE.md "Clerk auth"), not a hand-rolled
  OTP flow. This session is about styling Clerk's hosted sign-in/sign-up (`app/sign-in`, `app/sign-up`) to match
  the brand — welcome copy, hero treatment, "Need Help?" card — not reimplementing OTP.
- **Routes:** `/sign-in`, `/sign-up` (already scaffolded).
- **Hard rules that apply:** sign-in must never gate core demo flows (CLAUDE.md rule 6).

### 2. Registrations list
- **Prototype reference:** `design/portal-customer.html:982-1160` (5 card states: active/new, active/mid-coverage,
  active/nearing-expiration, expired, replaced — plus the empty state), and the registration-detail drawer at
  `design/portal-customer.html:1959-1974`.
- **Routes:** `/registrations`.
- **Upstream endpoints:** `GET /v1/registrations`, `GET /v1/registrations/{id}`.
- **Hard rules that apply:** never render the raw shared-tenant list response directly — filter to the current
  visitor's own activity via `demo_activity` before display (CLAUDE.md rule 3).

### 3. Registration flow
- **Prototype reference:** `design/portal-customer.html:1161-1392` — 3-step wizard: select order → select item
  (5 coverage-check states: included, already-registered, excluded, expired, usage-based) → confirm → success.
- **Routes:** `/registrations/new` (or similar wizard route).
- **Upstream endpoints:** `GET /v1/orders`, `POST /v1/registrations`.
- **Hard rules that apply:** record the resulting registration id in `demo_activity` (rule 2); use the
  `Idempotency-Key` header on the write; render this as a narrated API call (CLAUDE.md's core feature).

### 4. Warranty Policy page
- **Prototype reference:** `design/portal-customer.html:1393-1477` (static content: overview, coverage by
  category, what's covered/not covered, how to file a claim, conditions).
- **Routes:** `/warranty-policy`.
- **Notes:** content needs to be rewritten for Pergola Cave's actual product categories (aluminum frames, motors/
  electronics, fabric/canopy, hardware) instead of Trail Supply's footwear/apparel/backpacks/bikes. No live
  endpoint backs this today — check `GET /v1/rules` against the live spec to see if policy content should be
  sourced from there instead of hardcoded.

### 5. Claims list + detail
- **Prototype reference:** `design/portal-customer.html:1478-1686` — 3 states (info-requested, in-review,
  fulfilled) + empty state + claim detail (timeline, info-request banner, reply form).
- **Routes:** `/claims`, `/claims/{id}`.
- **Upstream endpoints:** `GET /v1/claims`, `GET /v1/claims/{id}`, `POST /v1/claims/{id}/transition` (customer
  reply on an info-requested claim).
- **Hard rules that apply:** same shared-tenant filtering rule as registrations (rule 3), scoped by
  `demo_activity` (rule 2).

### 6. Claim filing flow
- **Prototype reference:** `design/portal-customer.html:1687-1904` — select registration → describe issue
  (photo upload, usage input) → review (usage-over-limit warning) → success.
- **Routes:** `/claims/new`.
- **Upstream endpoints:** `POST /v1/claims`, `POST /v1/claims/{id}/attachments`.
- **Hard rules that apply:** scope to a registration the visitor actually owns (rule 2); `Idempotency-Key` on
  the write; narrated API call panel.

## Cross-cutting, tackle whenever it first becomes needed

- **Narrated API call console** — every write/read to `/v1/*` should render as a split-pane request/response
  log (method, path, body, status, latency, redacted `Authorization` header, copy-as-curl/fetch). Build this once
  the first real endpoint call is wired (likely in session 3 or 5) and reuse it everywhere after.
- **Rate limiting** (`src/lib/rate-limit.ts`) and **`demo_activity` scoping helpers** — needed by every session
  that writes data; build alongside whichever session hits it first, then reuse.
