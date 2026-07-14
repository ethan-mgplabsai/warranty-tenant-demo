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

- **Auth shell** — `components/auth-page-shell.tsx` (shared hero/headline/Need-Help wrapper), `app/sign-in`,
  `app/sign-up` restyled to match the landing page and Pergola Cave brand around Clerk's hosted `<SignIn />`/
  `<SignUp />` widgets, which already inherit the brand theme via `ClerkProvider appearance={{ theme: shadcn }}`
  in `app/layout.tsx`. No OTP flow — Clerk's own hosted UI handles auth strategy.

- **Registrations list** — `app/registrations/page.tsx` + `components/registrations/*`. Turned out the live API
  has three tiers under `/api/v1/*` (plain tenant-wide bearer-key, admin, and a customer tier pre-scoped to one
  OTP-verified email) — see CLAUDE.md's "The API this integrates with" section. This feature uses the
  **customer tier** (`POST /api/v1/customer/auth/send-otp` + `/verify-otp`, then `GET /api/v1/customer/registrations[/{id}]`),
  not the plain tier this doc originally assumed, so CLAUDE.md hard rule 3's `demo_activity` filtering doesn't
  apply here (the customer tier is already scoped server-side). Also stood up the two cross-cutting pieces below
  (narrated console, rate limiting) since this was the first real upstream call wired in the repo, and fixed a
  live bug in `app/layout.tsx` where the nav links were Clerk-gated (violated hard rule 6 — this flow's real gate
  is the OTP step, not Clerk sign-in).

## Up next

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
- **Upstream endpoints:** the live spec has both a plain-tier `GET /v1/claims`/`{id}`/`POST .../transition` and a
  customer-tier `GET/POST /api/v1/customer/claims`, `GET /api/v1/customer/claims/{id}`,
  `POST /api/v1/customer/claims/{id}/reply` — registrations (feature 2) went with the customer tier since it's
  pre-scoped server-side and the visitor is already OTP-verified from that flow; likely the right precedent to
  follow here too (reuse the existing customer session cookie rather than re-authenticating), but confirm against
  the live spec before assuming the shape matches.
- **Hard rules that apply:** if using the customer tier (recommended, see above), hard rule 3's `demo_activity`
  filtering doesn't apply (already scoped by Warrantini); if using the plain tier instead, it does.

### 6. Claim filing flow
- **Prototype reference:** `design/portal-customer.html:1687-1904` — select registration → describe issue
  (photo upload, usage input) → review (usage-over-limit warning) → success.
- **Routes:** `/claims/new`.
- **Upstream endpoints:** `POST /v1/claims`, `POST /v1/claims/{id}/attachments`.
- **Hard rules that apply:** scope to a registration the visitor actually owns (rule 2); `Idempotency-Key` on
  the write; narrated API call panel.

## Cross-cutting, tackle whenever it first becomes needed

- **Narrated API call console** — built in feature 2 (`components/registrations/api-console.tsx`,
  `lib/warrantini-client.ts`). Reuse this for every subsequent feature rather than rebuilding.
- **Rate limiting** (`lib/rate-limit.ts`) — built in feature 2 (Upstash sliding-window limiters, fails open with
  a console warning if `UPSTASH_REDIS_REST_URL`/`TOKEN` aren't configured). Reuse `checkOtpSendRateLimit`/
  `checkRegistrationsReadRateLimit` or add new limiter instances following the same pattern.
- **`demo_activity` scoping helpers + Drizzle schema** — still not built. Not needed by feature 2 (customer tier
  is pre-scoped by Warrantini itself), but required by any feature that talks to the **plain** tier or that
  writes data (features 3, 6, and 5/4 if they end up using the plain tier) — build alongside whichever of those
  hits it first, then reuse.
