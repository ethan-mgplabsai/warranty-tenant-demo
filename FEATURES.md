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

- **Registration flow** — `app/registrations/new/page.tsx` + `components/registrations/{wizard-view,wizard-steps,
  order-select-step,item-select-step,confirm-step,success-step}.tsx`. Live spec check turned up a **customer-tier**
  equivalent of the plain-tier endpoints this doc originally assumed (`GET /api/v1/customer/orders` — each line
  item pre-enriched with a `coverageStatus` — and `POST /api/v1/customer/registrations`), the same fork feature 5
  already flags for claims. Went with the customer tier: reuses feature 2's OTP gate/JWT cookie as-is, no local
  orders/registrations/rules composition needed since the API computes coverage status itself, and no
  `demo_activity`/Drizzle scaffolding needed (hard rule 3's customer-tier exception still applies). No
  `Idempotency-Key` header — not documented on this endpoint; the API's own `409` on a duplicate registration is
  the dedup mechanism instead.

- **Warranty Policy page** — `app/warranty-policy/page.tsx` + `components/warranty-policy/policy-view.tsx`. Ended
  up hybrid across two endpoints found by checking the live spec (this doc had only flagged `GET /v1/rules` to
  check): the published-policy overview comes from `GET /api/v1/customer/warranty-policy?slug=<tenant>` — a public
  endpoint, no auth at all, not previously in this doc's endpoint table — rendered as trusted first-party HTML with
  a static fallback if that call fails; the structured "Coverage by Category" table comes from `GET /v1/rules`
  (plain tier, this repo's **first** plain-tier call — `lib/warrantini-client.ts` gained an `apiKey` option
  alongside `customerToken`). Rules are shared tenant policy config, not per-visitor data, so hard rule 3 doesn't
  apply to it either. `DEMO_API_KEY` was provisioned and verified end-to-end against the live tenant (`wrnt_live_...`,
  returns real rule data) — the rules-backed table degrades to a "check back soon" note only if that call ever
  fails, which no longer happens by default.

  This also surfaced a real bug in `lib/rate-limit.ts`: the configured Upstash token is **read-only**, and
  `@upstash/ratelimit`'s sliding-window algorithm needs `EVALSHA` (Lua scripts) to atomically check-and-increment,
  which a read-only token can't run — every rate-limited route with no prior gate (`send-otp`, the new rules/
  warranty-policy routes) was 500ing. Fixed by wrapping `checkRateLimit`'s `.limit()` call in its own try/catch that
  fails open on any Redis-side error, not just "not configured" — matching the fail-open philosophy already stated
  in that file's own comments. Worth fixing at the token level too if real rate limiting is wanted in production.

## Up next

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
- **`demo_activity` scoping helpers + Drizzle schema** — still not built. Not needed by features 2, 3, or 4 in
  the end (all customer-tier, or — feature 4's rules table — shared tenant policy config rather than per-visitor
  data). Feature 3's plain-tier write (`POST /v1/registrations`) is still real and documented but unused; still
  required by whichever future feature first does a **plain-tier write** (feature 6, or 3/5 if ever redone against
  the plain tier) — build alongside whichever of those hits it first, then reuse.
