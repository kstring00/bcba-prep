# Technical Handoff — BCBA Prep

**Repo:** `kstring00/bcba-prep`
**Audience:** developer
**State:** pre-launch hardened — the sales gate is closed
**Companion documents:** `LAUNCH_CHECKLIST.md` (what remains),
`PRODUCTION_READINESS_AUDIT.md` (original findings and evidence),
`BRYANA_SITE_GUIDE.md` (owner operations), `CLIENT_OWNERSHIP_HANDOFF.md` (accounts)

> ### The sales gate — read this before touching checkout
>
> `lib/launch.ts` exports `SALES_ENABLED`, true only when
> `NEXT_PUBLIC_SALES_ENABLED === "true"`. It gates two layers:
>
> 1. **`app/api/checkout/route.ts` returns 503 before any Stripe call.** This
>    is authoritative and must stay the first statement in the handler. A
>    hand-written POST reaches this route directly, so nothing else protects
>    the customer's money.
> 2. **The storefront hides prices, buy buttons and the cart.** Courtesy only.
>    Never rely on it alone.
>
> It exists because there are no study materials yet. A completed payment today
> would leave a real customer with a receipt and nothing to download. Opening
> it is a launch-day step with prerequisites — see `LAUNCH_CHECKLIST.md`.
>
> Rollback is one environment variable.

> **No secret values appear in this document.** Environment variables are
> referenced by name only.

---

## 1. Architecture

Single Next.js 16 App Router application. No monorepo, no separate backend, no
middleware layer.

```
Browser
  │
  ├─ Next.js 16.3.4 (App Router, Turbopack, React 19)
  │    ├─ Static / SSG pages           → served from the edge
  │    ├─ /api/checkout   (nodejs)     → GATE → Stripe Checkout Session create
  │    ├─ /api/webhook    (nodejs)     → Stripe signature verify → console.log
  │    ├─ /api/contact    (nodejs)     → validate → rate limit → Resend
  │    └─ /api/testimonials (nodejs)   → Supabase REST insert/select
  │
  ├─ Supabase (direct fetch, no SDK)
  │    ├─ /auth/v1/*      ← called FROM THE BROWSER
  │    └─ /rest/v1/*      ← server-side only (testimonials)
  │
  ├─ Resend                            ← contact + testimonial alerts
  │
  └─ Stripe Hosted Checkout            ← unreachable while the gate is closed
```

**Key architectural facts:**

- **No `@supabase/supabase-js`.** All Supabase interaction is hand-rolled `fetch`
  against the REST/GoTrue HTTP APIs. Auth token handling, refresh and storage are
  reimplemented in `lib/supabase/auth-client.ts`.
- **No middleware.** `next build` emits no `middleware.js`. There is no
  server-side route protection anywhere.
- **Sessions live in `localStorage`**, not cookies (`auth-client.ts:37-44`). The
  server therefore has no way to identify the caller. This is the root cause of
  the client-only `/member` gate.
- **No `public/` directory.** All imagery is inline SVG (`components/Florals.tsx`,
  `Icons.tsx`, `Motifs.tsx`, `BeeMark.tsx`). Zero raster assets in the entire
  project.
- **No browser writes to Supabase.** The contact form previously POSTed
  straight to `/rest/v1/contact_messages` with the publishable key. That path
  is gone; `lib/supabase/contact-client.ts` was deleted. Do not reinstate it.
- **Fonts** are self-hosted at build time via `next/font/google`
  (`app/layout.tsx:13-25`) — no runtime CDN request.

## 2. Route map

| Route | Render | Auth | Notes |
|---|---|---|---|
| `/` | Static | — | Bookshelf storefront |
| `/domain/[slug]` | SSG ×9 | — | Product pages. `generateStaticParams` at `app/domain/[slug]/page.tsx:5`. **No `generateMetadata`.** |
| `/about` | Static | — | Placeholder stat/story/portrait blocks removed; no checkable claims |
| `/contact` | Static | — | Client component; POSTs to `/api/contact` |
| `/testimonials` | Dynamic (`force-dynamic`) | — | Server-fetches from Supabase REST |
| `/sign-in` | Static | — | Sign in + create account, tabbed |
| `/member` | **Static** | Client-only | Returns 200 to anonymous; redirects in `useEffect` |
| `/thanks` | Static | — | Success URL. Real copy; branches on the sales gate. Still ignores `session_id`. |
| `/privacy` | Static | — | Real policy describing the actual data flows |
| `/terms`, `/refunds` | Static | — | Real content |
| `/reset-password` | Static | Recovery token | Completes the password reset. Reads the token from the URL fragment. |
| `/robots.txt` | Static | — | `Disallow: /` |
| `/icon.svg` | Static | — | Favicon |
| `/api/checkout` | Dynamic, nodejs | — | POST only. **503 while the sales gate is closed.** |
| `/api/contact` | Dynamic, nodejs | — | POST only. Validation, honeypot, two-tier rate limit, Resend delivery. |
| `/api/webhook` | Dynamic, nodejs | Stripe signature | POST only |
| `/api/testimonials` | Dynamic, nodejs | — | GET + POST |
| `/sitemap.xml` | **Does not exist** | — | Returns 404. Listed in `LAUNCH_CHECKLIST.md` §4. |

## 3. Dependencies

`npm audit --omit=dev` → **0 vulnerabilities**.

| Package | Version | Role |
|---|---|---|
| `next` | 16.3.4 | Framework |
| `react` / `react-dom` | 19.2.8 | UI |
| `motion` | 13.1.1 | Animation |
| `stripe` | 22.6.1 | Server SDK. **Bundled, not externalized** — relevant if you try to intercept it in tests. |
| `typescript` | 7.0.2 | Dev |

**`motion` pinning note:** `components/AddToCart.tsx:123-139` documents that in
13.1.1, `transition.path` is honored only by the imperative `animate()` API and
silently ignored on a motion component's `transition` prop. Verify this still
holds before bumping to 13.2.0.

## 4. Environment variables (names only)

| Name | Read at | Required | Failure mode if missing |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | `lib/stripe.ts:8` | **Yes** | Throws → checkout returns 500 |
| `STRIPE_WEBHOOK_SECRET` | `app/api/webhook/route.ts:10` | **Yes** | Webhook returns 500 |
| `NEXT_PUBLIC_SALES_ENABLED` | `lib/launch.ts` | **Yes** | Store is closed unless exactly `"true"`. Fails safe. |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/config.ts` | **Yes** | Throws at call time when absent. No fallback. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `lib/supabase/config.ts` | **Yes** | Throws at call time when absent. No fallback. |
| `RESEND_API_KEY` | `lib/email.ts` | For contact | Contact form **refuses** submissions without it |
| `CONTACT_INBOX_EMAIL` | `lib/email.ts` | For contact | Destination inbox |
| `CONTACT_FROM_EMAIL` | `lib/email.ts` | For contact | Must be a Resend-verified domain |
| `NEXT_PUBLIC_SITE_URL` | `lib/stripe.ts:17` | Recommended | Falls back to `VERCEL_URL`, then `localhost:3000` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | `components/MicrosoftClarity.tsx` | No | No fallback. Tracking off unless set. |
| `TESTIMONIAL_REVIEW_EMAIL` | `app/api/testimonials/route.ts` | No | Falls back to `CONTACT_INBOX_EMAIL` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | *nowhere* | **No** | Declared in `.env.example:11`; **never read by any code** |

> ### ✅ Silent env fallbacks removed
>
> Four files previously used `process.env.X ?? "<hardcoded literal>"`. The
> literals were publishable browser credentials, so the exposure was never the
> problem — the *silence* was: a preview deployment with a missing variable
> quietly connected to the production project and wrote real customer data into
> it.
>
> `lib/supabase/config.ts` now throws instead. The check is **lazy** — at call
> time, not module load — so a build or page render without the variables still
> succeeds and the site stays up; only the feature that needs Supabase fails,
> loudly, in the logs. The Clarity project ID fallback was removed the same way.

## 5. Stripe configuration

### Checkout — `app/api/checkout/route.ts`

```
POST /api/checkout
Body: { items: [{ productId: string, quantity: 1 }] }
→ 200 { url }  |  400 (validation)  |  500 (Stripe error, message suppressed)
```

**Pricing authority.** The route reads **only** `body.items[].productId` and
`body.items[].quantity`. Every monetary and entitlement value is derived
server-side:

- `unit_amount` ← `pricing.total` from `getLicensePricing()` (`:56`, `:69`)
- `metadata.entitlement_slugs` ← `pricing.entitlementSlugs` (`:62`, `:93`)

A client-supplied `price`, `unit_amount`, `amount`, `amount_total`, or
`entitlementSlugs` is never read. **Do not refactor this to accept a price.**

**Session shape:**

| Field | Value |
|---|---|
| `mode` | `payment` |
| `ui_mode` | `hosted` |
| `line_items` | Exactly one synthetic `price_data` line, quantity 1 |
| `billing_address_collection` | `auto` |
| `success_url` | `{siteUrl}/thanks?session_id={CHECKOUT_SESSION_ID}` |
| `cancel_url` | `{siteUrl}/?cart=open` |
| `metadata.license_scope` | `personal_non_transferable` |
| `metadata.entitlement_slugs` | Comma-separated domain slugs |
| `metadata.source_product_ids` | Comma-separated product ids |
| `metadata.pricing_tier` | Tier label, or `individual` |

**Not configured:** `automatic_tax`, `customer_creation`, `invoice_creation`,
`allow_promotion_codes`, `expires_at`, idempotency keys.

### Pricing model — `lib/products.ts`

`DOMAIN_LICENSE_PRICE = 2900` · `THREE_DOMAIN_PRICE = 7500` ·
`FIVE_DOMAIN_PRICE = 11500` · `COMPLETE_LIBRARY_PRICE = 17900`

`getLicensePricing()` (`:94-168`) resolves the best tier: 8+ selected domains
upgrade to the complete library (9 slugs for $179); 5–7 use the five-pack plus
extras; 3–4 use the three-pack plus extras. Verified against all 12 cart shapes —
see the audit's §2.1 table.

**The cart uses the same function** (`lib/cart-context.tsx:80-83`), so displayed
and charged totals cannot diverge.

### Webhook — `app/api/webhook/route.ts`

```
POST /api/webhook
Headers: stripe-signature
→ 400 missing signature | 400 invalid signature | 500 secret unset | 200 received
```

`runtime = "nodejs"` (`:7`) and `await request.text()` before verification
(`:21`) — both correct and both required. `constructEvent` at `:25`.

**Handles exactly one event type:** `checkout.session.completed`, and only when
`payment_status === "paid"` (`:31-36`).

> ### 🔴 Lines 61–67 are the entire fulfillment implementation
>
> ```ts
> console.log("[webhook] paid license", {
>   eventId, sessionId, email, licenseScope, entitlementSlugs,
> });
> ```
>
> No persistence. No idempotency. No notification. `grep -cE 'insert|upsert'` on
> this file returns `0`.
>
> The comment block at `:49-60` correctly specifies what must be built: persist
> `event.id` + `session.id` idempotently, associate the verified email with a
> member account, and grant `entitlementSlugs`. **Uniqueness on `event.id` or
> `session.id` must exist before any grant is written.**

**Not handled:** `charge.refunded`, `charge.dispute.created`,
`payment_intent.payment_failed`, `checkout.session.expired`,
`checkout.session.async_payment_failed`.

## 6. Supabase configuration

**Everything in this section about live state is UNVERIFIED** — the audit
environment could not reach `*.supabase.co`.

### What the code depends on

| Feature | Endpoint | Called from | Credential |
|---|---|---|---|
| Sign in | `/auth/v1/token?grant_type=password` | **Browser** | publishable |
| Sign up | `/auth/v1/signup` | **Browser** | publishable |
| Password reset request | `/auth/v1/recover` | **Browser** | publishable |
| Session refresh | `/auth/v1/token?grant_type=refresh_token` | **Browser** | publishable |
| Sign out | `/auth/v1/logout` | **Browser** | user access token |
| Contact insert | `/rest/v1/contact_messages` | **Browser** | publishable |
| Testimonial insert | `/rest/v1/testimonials` | Server route | publishable |
| Testimonial select | `/rest/v1/testimonials` | Server + server route | publishable |

**The service-role key is used nowhere.** Confirmed by full-repo and
client-bundle sweep.

### Schema drift

`supabase/schema.sql` is headed **"FUTURE ARCHITECTURE ONLY"** and states *"No
BCBA Prep Supabase project is connected by this file."* It is **not** the live
schema. Two concrete divergences prove it:

1. `schema.sql:187-198` defines `testimonials` with `is_published`,
   `is_featured`, `quote`, `name`, `credential`, `rating`. The application writes
   `display_name`, `email`, `consent_to_publish`, and `status: 'pending'`
   (`api/testimonials/route.ts:148-154`). Different columns entirely.
2. `contact_messages` is written to by `lib/supabase/contact-client.ts` and **does
   not appear in `schema.sql` at all.**

**Do not treat `schema.sql` as documentation of production.** Before any
migration, dump the live schema and compare.

### Tables referenced only by `schema.sql`, never by application code

`member_profiles`, `purchases`, `purchase_items`, `entitlements`, `materials`,
and the `materials` storage bucket. `grep -rn 'entitlements\|purchases\|
materials' app lib components` → zero matches. These are inert.

The RLS policies in that file are, for what it is worth, well designed:
owner-scoped `using ((select auth.uid()) = user_id)`, `security invoker` on the
helper function, an explicit warning at `:14-17` never to authorize from
`user_metadata`, and the bucket created with `public = false`. If the model is
ever adopted, that file is a sound starting point.

## 7. Authentication flow

```
sign-in/page.tsx
  → signInWithPassword()            auth-client.ts:72
  → POST /auth/v1/token?grant_type=password
  → saveSession() → localStorage["bcba-prep-supabase-session"]   :37-44
  → router.push("/member")

member/page.tsx (mount)
  → refreshStoredSession()          :127
      ├─ no stored session      → router.replace("/sign-in")
      ├─ >60s of life remaining → reuse
      └─ else → POST /auth/v1/token?grant_type=refresh_token
                 ├─ ok   → saveSession()
                 └─ fail → clearStoredSession() → redirect
```

**`expires_at` is computed locally** as `now + expires_in` at `:39` rather than
taken from the token. Clock skew on the client shifts refresh timing. Minor.

**Sign-out** (`:158-176`) clears `localStorage` even when the network logout
call fails — correct fail-safe design.

**Password reset is incomplete.** `requestPasswordReset()` (`:102-106`) sends the
email; no route in the application consumes the recovery link. Building
`/reset-password` also requires setting the redirect URL in the Supabase Auth
dashboard.

## 8. Entitlement flow

**There is none.**

`Product.entitlementSlugs` (`lib/products.ts:19`) is resolved server-side and
written into Stripe session metadata. That is the full extent of the entitlement
system: **a string in Stripe.**

`app/member/page.tsx` contains no query, no fetch, and no reference to
entitlements. Lines 134-139 are a hardcoded empty state. Lines 202-217 render all
nine domains to every signed-in user as browse links.

**Customers who bought different things receive identical pages.**

### If you build this, build it in this order

1. `purchases` table, unique on `stripe_checkout_session_id`. Write from the
   webhook.
2. Idempotency: reject a second write for the same `event.id` **before** granting.
3. Link purchase → user. **The hard part:** checkout does not require an account,
   so `session.customer_details.email` is the only join key, and it is
   user-supplied at checkout. Decide now whether to require sign-in before
   checkout (simpler, converts worse) or to reconcile by email later (converts
   better, needs a claim flow and an admin fallback).
4. `entitlements` rows derived from `metadata.entitlement_slugs` — **never from
   anything the browser sent.**
5. Read entitlements in `/member` **server-side**, which requires moving sessions
   from `localStorage` to httpOnly cookies first.
6. Serve materials through a server route that checks entitlement and issues a
   short-lived signed URL. Never expose a bucket path.
7. Add `charge.refunded` and `charge.dispute.created` handlers to revoke.

## 9. Data model — what actually exists

| Store | Contents | Source of truth for |
|---|---|---|
| **Stripe** | Payments, customer emails, session metadata (`entitlement_slugs`, `license_scope`, `source_product_ids`, `pricing_tier`) | **All purchase data. The only durable order record.** |
| **Supabase Auth** | Member accounts (email + password) | Identity, disconnected from purchases |
| **Supabase `contact_messages`** | Contact form submissions | Customer messages. **Nothing reads this table.** |
| **Supabase `testimonials`** | Testimonial submissions incl. submitter email | Testimonials |
| **Browser `localStorage`** | Auth session under `bcba-prep-supabase-session` | Client session |
| **Browser memory** | Cart (`useState`, not persisted) | Cart |
| **Vercel runtime logs** | `[webhook] paid license {...}` lines | Fulfillment record — **retention-limited, not queryable by email** |
| **Git** | Prices, product catalogue, all copy | Pricing and content |

**There is no materials store of any kind.**

## 10. Storage layout

None. No `public/` directory, no bucket referenced by code, no `storage/v1`
calls, no `createSignedUrl`. `schema.sql:213-215` proposes a private `materials`
bucket; nothing implements it.

## 11. Forms

### Contact — `app/contact/page.tsx` → `app/api/contact/route.ts`

Client component POSTs JSON to `/api/contact`. The route validates server-side
(name 2–120, email regex, subject against an allowlist, message 10–5000),
carries a honeypot field, and delivers via Resend with `reply_to` set to the
sender so a reply reaches the person who wrote in.

**Two rate-limit tiers, deliberately** (`lib/rate-limit.ts`):

| Tier | Limit | Counts |
|---|---|---|
| `contact-flood` | 40 / 10 min | Every request, including malformed |
| `contact-send` | 5 / 10 min | Only submissions that pass validation |

The split matters. A single counter meant five mistyped emails locked a real
person out for ten minutes — caught in testing, and the reason the tiers exist.

**When email is unconfigured the route returns 503 with an honest error** and
names an alternative. It does not accept the message. Reporting success for a
message that goes nowhere is the exact failure this route replaced.

**Known limitation:** the limiter is in-process. On Vercel the real ceiling is
roughly `limit × instance count` and resets on cold start. That is documented
at the top of `lib/rate-limit.ts` and is a deliberate trade, not an oversight —
move it to a shared store if it ever needs to be a hard guarantee.

### Testimonials — `app/api/testimonials/route.ts`

Properly server-routed. Honeypot at `:99-101` returns `200 {received:true}`
without inserting. Validation at `:103-138`: name 1–80, email regex + 3–320,
quote 20–1200, consent must be `true`. All confirmed by execution.

Optional Resend reviewer alert at `:23-68` — no-ops unless three env vars are set,
and never fails the submission. Good design.

> ### ✅ Moderation filter added
>
> Inserts write `status: 'pending'`. Both read queries — in
> `app/api/testimonials/route.ts` and `app/testimonials/page.tsx` — now filter
> `status=eq.approved`, which makes the on-page promise ("every testimonial
> below is reviewed before it is published") true. Without it, every submission
> published instantly.
>
> **Two things still to confirm against the live database:** that the
> `testimonials` table has a `status` column, and that the approved value is
> exactly the string `approved`. If the column is named differently, change it
> in **both** files together — a mismatch silently blanks the page rather than
> erroring.
>
> **There is no approval UI.** Approving means editing a row in Supabase.
> Documented honestly as such in `BRYANA_SITE_GUIDE.md`; worth building a small
> screen only once testimonials arrive regularly.

`GET /api/testimonials` degrades to `{ testimonials: [] }` with HTTP 200 on any
failure, including an unconfigured Supabase. The page renders its empty state
rather than surfacing an outage as a broken page.

## 12. Analytics

`components/MicrosoftClarity.tsx`, mounted at `app/layout.tsx:92`. Inline
snippet, `strategy="afterInteractive"`. Project ID validated against
`/^[a-zA-Z0-9]+$/` at `:9-14` before rendering — fails closed. A hardcoded
fallback ID at `:7` means Clarity is active whether or not the env var is set.
No custom events, no purchase tracking.

## 13. Known limitations

**Closed by the hardening pass:**

~~No privacy policy · placeholder tokens on public pages · unmoderated
testimonials · unreadable contact messages · dead-end password reset · direct
browser writes to Supabase · silent env fallbacks · missing security headers ·
sub-3:1 focus indicators · cart panel not a dialog · inaccurate README~~

**Open, and deferred on purpose** (see `LAUNCH_CHECKLIST.md`):

1. **No fulfillment.** The webhook still only logs. Deferred: there is nothing
   to fulfil, and the sales gate makes it unreachable.
2. **No entitlements.** All signed-in users see the same page. Architecture is
   documented in `LAUNCH_CHECKLIST.md` §3; not built.
3. **No materials, no storage, no delivery path.**
4. **Sessions in `localStorage`**, so no server-side auth is possible. Must be
   revisited before any paid file is served.
5. **`/member` is a static page**, client-gated only. Acceptable while nothing
   is behind it.

**Open, unrelated to materials:**

6. `/thanks` still ignores the `session_id` it is handed.
7. No sitemap, no canonical URLs, no OG image, no per-product metadata.
8. No Content-Security-Policy — deliberate; needs the final third-party origin
   list, and a wrong CSP fails silently.
9. Rate limiting is per-instance (see §11).
10. No tests, no CI.
11. **No `main` branch**; production deploys from a feature branch.
12. No testimonial approval UI.
13. Sales tax undecided.

## 14. Recovery procedures

### The webhook endpoint dies

**Current impact: none** — no payment can occur while the sales gate is closed,
and the webhook grants nothing in any case. Keep this for after launch.

1. Stripe → **Developers → Webhooks** → open the endpoint → check **Recent
   deliveries** for failures.
2. Stripe retries failed deliveries automatically for up to 3 days.
3. `Not configured` 500s mean `STRIPE_WEBHOOK_SECRET` is missing in Vercel.
4. `Invalid signature` 400s mean the secret does not match the endpoint. Rotate
   in Stripe, update in Vercel, redeploy.
5. **No sale is lost either way.** Reconstruct from Stripe → **Payments** →
   session **Metadata**.

**Once fulfillment exists,** add: replay the failed events from the Stripe
dashboard, and confirm idempotency prevented double grants.

### A customer's access is missing

**Not reachable today** — nobody can purchase. After launch, if fulfilment is
still manual:

1. Stripe → **Payments** → search the customer email.
2. Open the payment → **Metadata** → read `entitlement_slugs`.
3. Map slugs to domains using the table in `BRYANA_SITE_GUIDE.md`.
4. Email the materials by hand. Log it.

**Once fulfillment exists:** check for a `purchases` row by
`stripe_checkout_session_id`; if absent, replay the webhook event; if present but
entitlements are missing, the grant step failed — fix and re-run, relying on
idempotency.

### The store opened by accident

The single most important rollback in this project.

1. Vercel → project → **Settings → Environment Variables**.
2. Set `NEXT_PUBLIC_SALES_ENABLED` to `false` (or delete it — absent is closed).
3. **Redeploy.** The value is inlined at build time, so changing the variable
   alone does nothing until a rebuild.
4. Confirm: `curl -X POST https://<domain>/api/checkout -H 'Content-Type: application/json' -d '{"items":[{"productId":"module-ethics","quantity":1}]}'`
   must return **503**.
5. If any payment did complete, refund it in Stripe immediately and email the
   customer an explanation. Do not leave a charge outstanding for materials
   that cannot be delivered.

### A contact message was reported but never arrived

1. Check the Vercel runtime logs for `[contact]`. A delivery failure logs there.
2. `email is not configured` means one of `RESEND_API_KEY`,
   `CONTACT_INBOX_EMAIL`, `CONTACT_FROM_EMAIL` is missing — the visitor got an
   honest 503, so they know it failed.
3. A Resend rejection usually means `CONTACT_FROM_EMAIL` is on an unverified
   domain. Verify the domain in Resend.
4. A 429 means the rate limiter fired. Check whether it was the flood tier (40)
   or the send tier (5) — the log and the returned message differ.

### A deploy breaks production

1. Vercel → project → **Deployments**.
2. Find the last known-good deployment.
3. **⋯ → Promote to Production** (or **Rollback**). Takes seconds.
4. Then diagnose. **Do not debug on production.**
5. If the break is env-var related, fix the variable and **redeploy** —
   changing a variable alone does not rebuild.

### Stripe keys compromised

1. Stripe → **Developers → API keys** → **Roll** the secret key.
2. Update `STRIPE_SECRET_KEY` in Vercel. Redeploy.
3. Roll the webhook signing secret; update `STRIPE_WEBHOOK_SECRET`. Redeploy.
4. Review **Payments** and **Logs** for unexpected activity.

### Supabase publishable key rotated

Because four files hardcode a fallback, **rotating the key does not fully take
effect until those literals are removed**. Remove them in the same change.

## 15. Branch and deployment workflow

### Current state

- **Default branch:** `claude/bcba-bookshelf-nav-p63hnv` — there is no `main`.
- `chatgpt/backend-foundation` is an **orphan root** with no common ancestor
  (`git merge-base` returns empty). Diff: 40 files, −4,897 lines. **Merging it
  would delete the member area, sign-in, testimonials, Clarity and the noindex
  protections.**
- Its history contains eight `No-op sync checkpoint` commits.
- No `vercel.json`, no `.github/`, no CI.

### Recommended (not implemented — requires approval)

1. Create `main` from the current default branch head (`e35dad0`).
2. Set `main` as the GitHub default branch and the Vercel production branch.
3. Protect `main`: require a PR, disallow force-push.
4. Feature branches → PR → Vercel preview → merge.
5. **Archive or delete `chatgpt/backend-foundation`** after confirming nothing in
   it is wanted. Tag it first if in doubt.
6. Add a minimal CI check: `npm ci && npx next build`.

**No branch operation has been performed.** Per the audit's operating rules, none
is permitted without explicit approval.

## 16. Launch-day checklist

Moved to **`LAUNCH_CHECKLIST.md`**, which is the single source of truth for
what remains between today and the first real customer. It covers the ordered
steps, the deferred work and why each item is deferred, the intended
entitlement architecture, the three files that must be flipped together to
enable indexing, and every environment variable to set.

Do not maintain a second copy here.
