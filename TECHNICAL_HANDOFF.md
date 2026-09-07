# Technical Handoff — BCBA Prep

**Repo:** `kstring00/bcba-prep`
**Documented commit:** `e35dad0`
**Audience:** developer
**Companion documents:** `PRODUCTION_READINESS_AUDIT.md` (findings and evidence),
`BRYANA_SITE_GUIDE.md` (owner operations), `CLIENT_OWNERSHIP_HANDOFF.md` (accounts)

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
  │    ├─ /api/checkout   (nodejs)     → Stripe Checkout Session create
  │    ├─ /api/webhook    (nodejs)     → Stripe signature verify → console.log
  │    └─ /api/testimonials (nodejs)   → Supabase REST insert/select
  │
  ├─ Supabase (direct fetch, no SDK)
  │    ├─ /auth/v1/*      ← called FROM THE BROWSER
  │    └─ /rest/v1/*      ← called from browser (contact) AND server (testimonials)
  │
  └─ Stripe Hosted Checkout            ← card data never touches this origin
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
- **Fonts** are self-hosted at build time via `next/font/google`
  (`app/layout.tsx:13-25`) — no runtime CDN request.

## 2. Route map

| Route | Render | Auth | Notes |
|---|---|---|---|
| `/` | Static | — | Bookshelf storefront |
| `/domain/[slug]` | SSG ×9 | — | Product pages. `generateStaticParams` at `app/domain/[slug]/page.tsx:5`. **No `generateMetadata`.** |
| `/about` | Static | — | Contains 6 `[[TODO_]]` tokens |
| `/contact` | Static | — | Client component; writes direct to Supabase |
| `/testimonials` | Dynamic (`force-dynamic`) | — | Server-fetches from Supabase REST |
| `/sign-in` | Static | — | Sign in + create account, tabbed |
| `/member` | **Static** | Client-only | Returns 200 to anonymous; redirects in `useEffect` |
| `/thanks` | Static | — | Success URL. Contains `[[TODO_DELIVERY_NOTE]]`. Ignores `session_id`. |
| `/privacy` | Static | — | Contains `[[TODO_PRIVACY]]` |
| `/terms`, `/refunds` | Static | — | Real content |
| `/blog`, `/updates`, `/resources`, `/study-guides`, `/mock-exams` | Static | — | **100% placeholder. Unlinked from nav. Candidates for deletion.** |
| `/robots.txt` | Static | — | `Disallow: /` |
| `/icon.svg` | Static | — | Favicon |
| `/api/checkout` | Dynamic, nodejs | — | POST only |
| `/api/webhook` | Dynamic, nodejs | Stripe signature | POST only |
| `/api/testimonials` | Dynamic, nodejs | — | GET + POST |
| `/sitemap.xml` | **Does not exist** | — | Returns 404 |
| `/reset-password` | **Does not exist** | — | **Password reset dead-ends here** |

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
| `NEXT_PUBLIC_SUPABASE_URL` | 4 files | **Yes** | ⚠️ **Silently falls back to a hardcoded project ref** |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 4 files | **Yes** | ⚠️ **Silently falls back to a hardcoded key** |
| `NEXT_PUBLIC_SITE_URL` | `lib/stripe.ts:17` | Recommended | Falls back to `VERCEL_URL`, then `localhost:3000` |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | `components/MicrosoftClarity.tsx:7` | No | ⚠️ **Falls back to a hardcoded project ID — Clarity runs regardless** |
| `RESEND_API_KEY` | `app/api/testimonials/route.ts:28` | No | Reviewer notification silently no-ops |
| `TESTIMONIAL_REVIEW_EMAIL` | `:29` | No | Same |
| `TESTIMONIAL_FROM_EMAIL` | `:30` | No | Same |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | *nowhere* | **No** | Declared in `.env.example:11`; **never read by any code** |

> ### ⚠️ The `??` fallback pattern is a production hazard
>
> Four files use `process.env.X ?? "<hardcoded literal>"`:
> `lib/supabase/auth-client.ts:1-7`, `lib/supabase/contact-client.ts:1-7`,
> `app/api/testimonials/route.ts:3-9`, `app/testimonials/page.tsx:7-13`.
>
> A missing, misspelled, or wrongly-scoped Vercel variable does not fail the
> build or the request — it **silently connects to the hardcoded project**. A
> preview or staging deployment will write real customer contact messages into
> the production database with no signal that anything is wrong.
>
> **Recommended:** replace with a `requireEnv()` helper that throws at module
> load. The values themselves are publishable browser credentials, so the
> exposure is not the problem — the silent-fallback behavior is.

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

### Contact — `app/contact/page.tsx` → `lib/supabase/contact-client.ts`

Client component. `POST /rest/v1/contact_messages` **direct from the browser**
with the publishable key. Client-side validation only. **No honeypot, no rate
limit, no CAPTCHA, no server route.** Anyone can extract the key from the bundle
and insert rows directly. Nothing in the codebase reads the table.

### Testimonials — `app/api/testimonials/route.ts`

Properly server-routed. Honeypot at `:99-101` returns `200 {received:true}`
without inserting. Validation at `:103-138`: name 1–80, email regex + 3–320,
quote 20–1200, consent must be `true`. All confirmed by execution.

Optional Resend reviewer alert at `:23-68` — no-ops unless three env vars are set,
and never fails the submission. Good design.

> ### 🔴 The moderation filter is missing
>
> Inserts use `status: 'pending'` (`:153`). Both read queries —
> `api/testimonials/route.ts:72` and `app/testimonials/page.tsx:33` — are:
>
> ```
> /rest/v1/testimonials?select=id,display_name,quote,created_at&order=created_at.desc&limit=16
> ```
>
> **No status filter.** The function containing it is named
> `getApprovedTestimonials`. If RLS permits anonymous `SELECT` — which it must for
> the page to render — every submission publishes immediately, while
> `app/testimonials/page.tsx:81` tells visitors *"Every testimonial below is
> reviewed before it is published."*
>
> Fix requires knowing the live column and approved-state value. **Confirm against
> the live schema first; a wrong guess silently blanks the page.**

## 12. Analytics

`components/MicrosoftClarity.tsx`, mounted at `app/layout.tsx:92`. Inline
snippet, `strategy="afterInteractive"`. Project ID validated against
`/^[a-zA-Z0-9]+$/` at `:9-14` before rendering — fails closed. A hardcoded
fallback ID at `:7` means Clarity is active whether or not the env var is set.
No custom events, no purchase tracking.

## 13. Known limitations

1. **No fulfillment.** Webhook only logs.
2. **No entitlements.** All signed-in users see the same page.
3. **No materials.** Nothing to deliver.
4. **No purchase notification** to owner or customer beyond Stripe's receipt.
5. **Password reset dead-ends** — no `/reset-password` route.
6. **Contact messages are unreadable** — no UI reads the table.
7. **Testimonials are unmoderated** despite an on-page claim of moderation.
8. **Sessions in `localStorage`** — no server-side auth possible.
9. **`/member` is a static page** — client-side gate only.
10. **Direct browser writes to Supabase** with no rate limiting.
11. **Silent env fallbacks** to a hardcoded project.
12. **No security headers** beyond `X-Robots-Tag`.
13. **Placeholder tokens rendered on 8 public pages**, including `/thanks` and
    `/privacy`.
14. **No sitemap, no canonicals, no OG image, no per-product metadata.**
15. **No tests of any kind**, no CI, no lint config beyond `next lint`.
16. **No `main` branch**; production deploys from a feature branch.
17. **`README.md` is materially inaccurate** — `:58-59` and `:89-90` claim prices
    are `[[TODO_]]` tokens and that checkout returns 503. Both false: prices are
    real and checkout is live. A developer relying on the README will
    underestimate live risk.

## 14. Recovery procedures

### The webhook endpoint dies

**Current impact: near zero** — the webhook grants nothing. Payments still
complete; Stripe holds the money and the metadata regardless.

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

**Today this is every customer.** The manual procedure:

1. Stripe → **Payments** → search the customer email.
2. Open the payment → **Metadata** → read `entitlement_slugs`.
3. Map slugs to domains using the table in `BRYANA_SITE_GUIDE.md`.
4. Email the materials by hand. Log it.

**Once fulfillment exists:** check for a `purchases` row by
`stripe_checkout_session_id`; if absent, replay the webhook event; if present but
entitlements are missing, the grant step failed — fix and re-run, relying on
idempotency.

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

**Pre-flight**

- [ ] Every launch blocker in `PRODUCTION_READINESS_AUDIT.md` §Part 4 is closed
- [ ] `grep -rn '\[\[TODO_' --include='*.tsx' app components` returns **nothing**
- [ ] Study materials exist and a delivery method is agreed
- [ ] Order-notification email is live and tested
- [ ] Privacy policy written; attorney has reviewed Terms, Refunds and Privacy
- [ ] Contact form delivers to a real monitored inbox — send a test and watch it arrive
- [ ] Testimonial moderation filter in place, or the page is removed
- [ ] `/reset-password` exists and a full reset has been completed end to end

**Stripe**

- [ ] Account is in Bryana's name with her bank and tax details
- [ ] `STRIPE_SECRET_KEY` set to the **live** key in Vercel (Production scope only)
- [ ] Live webhook endpoint registered at `https://<domain>/api/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` set to the **live** endpoint's secret
- [ ] Test-mode purchase completed end to end; `amount_total` matches the catalogue
- [ ] Webhook delivery confirmed 200 in **Recent deliveries**
- [ ] Receipt emails enabled and confirmed received
- [ ] Tax decision made and documented

**Vercel**

- [ ] Production domain attached, DNS resolving, HTTPS valid
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production origin
- [ ] All required variables present in the **Production** scope
- [ ] Production build green
- [ ] Runtime logs clean

**Flip indexing — all three, together**

- [ ] `next.config.ts:10-14` — remove the `X-Robots-Tag` header block
- [ ] `app/layout.tsx:51-63` — remove the `robots` metadata block
- [ ] `app/robots.ts:13-19` — replace `disallow: "/"` with an allow rule
- [ ] Add `app/sitemap.ts`
- [ ] Add `generateMetadata` to `app/domain/[slug]/page.tsx`
- [ ] Add an OG image
- [ ] Verify: `curl -I https://<domain>/` shows **no** `X-Robots-Tag`

**First 24 hours**

- [ ] Place one real purchase with a real card
- [ ] Confirm the notification email arrives
- [ ] Fulfil it by hand, timed, to validate the process
- [ ] Refund it and confirm the refund lands
- [ ] Watch Vercel logs and Stripe events for the first real customer
