# Production Readiness Audit — BCBA Prep

> ## ⚠️ STATUS UPDATE — this audit has been acted on
>
> **Audit date:** 2026-09-07 (commit `e35dad0`)
> **Hardening pass:** 2026-09-07, same day
>
> After this audit was delivered, the engagement scope changed. Bryana is
> intentionally not releasing her BCBA materials until she passes her own exam,
> so the work became a **pre-launch hardening phase, not a commerce launch**.
>
> **Most of the launch blockers below are now fixed.** The findings are
> preserved unedited as the record of what was found and how it was verified —
> do not read the status columns as current. For today's state, read
> `LAUNCH_CHECKLIST.md`.
>
> | Blocker | Then | Now |
> |---|---|---|
> | **B-3** No study materials | 🔴 | ⚪ **Deferred by design.** The store is gated closed so it cannot sell them. |
> | **B-2** Order reaches no human | 🔴 | ⚪ **Deferred.** No orders are possible while the gate is closed. |
> | **C-3** "Final sale" on undeliverable product | 🔴 | ✅ **Fixed.** Terms and Refunds carry a pre-launch notice; nothing is for sale. |
> | **C-1** Placeholder tokens on 8 public pages | 🔴 | ✅ **Fixed.** Zero tokens in source or rendered HTML; 5 placeholder routes deleted. |
> | **C-2** Placeholder privacy policy | 🔴 | ✅ **Fixed.** Real policy describing the actual data flows. |
> | **F-2** Unmoderated testimonials | 🔴 | ✅ **Fixed.** Both queries filter `status=eq.approved`. |
> | **F-1** Contact messages reach nobody | 🔴 | ✅ **Fixed.** Server route with email delivery; refuses rather than faking success. |
> | **A-1** Password reset dead-ends | 🔴 | ✅ **Fixed.** `/reset-password` completes the flow. |
> | **B-1** No entitlement system | 🔴 | ⚪ **Deferred.** Architecture documented in `LAUNCH_CHECKLIST.md` §3. |
> | **D-1** Unrate-limited browser writes | 🔴 | ✅ **Fixed.** Browser→Supabase contact path removed; server route rate-limited. |
> | **SEC-1** No security headers | 🟡 | ✅ **Fixed.** Five headers added. |
> | **A11Y-1** Focus ring 1.09:1 | 🟡 | ✅ **Fixed.** Now 6.08:1, measured. |
> | **A11Y-2** Cart panel not a dialog | 🟡 | ✅ **Fixed.** Role, focus trap, Escape. |
> | **R-5** Silent env fallbacks | 🟡 | ✅ **Fixed.** No hardcoded Supabase or Clarity values remain. |
> | **DOC-1** README materially wrong | 🟡 | ✅ **Fixed.** |
> | **R-1** No `main` branch | 🔴 | ⏳ **Still open.** Needs approval for branch operations. |
>
> **A new control was added that did not exist at audit time:** a sales gate at
> `lib/launch.ts`. `/api/checkout` returns 503 before any Stripe call, so the
> site cannot accept a real payment for materials that do not exist. Verified
> against a direct hand-written POST.

---

**Repo:** `kstring00/bcba-prep`
**Audited commit:** `e35dad0` ("Replace TODO site meta description", 2026-09-02)
**Audit date:** 2026-09-07
**Client:** Bryana Utley / Bee the Behavior Bae · **Developer:** Kyle

---

## The one-sentence answer

**A stranger can pay $179 tonight. They will receive a Stripe receipt, a page
that reads `[[TODO_DELIVERY_NOTE]]`, and nothing else.** There are no study
materials anywhere in this system, no record of the purchase outside Stripe, no
process that notifies Bryana a sale happened, and a published refund policy that
says all sales are final.

The payment *intake* is genuinely well built. The payment *outcome* does not exist.

---

## How to read this document

Every status claim below carries one of three labels:

| Label | Meaning |
|---|---|
| **[EXECUTED]** | I ran it and observed the result. |
| **[CODE-VERIFIED]** | I traced the complete code path by reading it. |
| **[UNVERIFIED]** | I could not confirm it. Each one states exactly what would be needed. |

### What this audit could not reach

This audit ran in a sandbox whose outbound network is allowlisted. **[EXECUTED]**
`api.stripe.com` and `*.supabase.co` both return `403 Host not in allowlist` at
the proxy; `api.github.com` returns 200. No Stripe or Supabase credentials were
present in the environment (`env | grep -E '^(STRIPE|SUPABASE|NEXT_PUBLIC)'`
returned empty).

Everything below is therefore **UNVERIFIED**, and each is flagged where it appears:

- Whether the Supabase project is provisioned at all, which tables exist, and
  whether RLS is enabled on them
- Whether any storage bucket exists and whether it is public
- Stripe dashboard state: test vs live mode, webhook endpoint registration, tax
  settings, receipt settings, account ownership
- Vercel state: production domain, DNS, environment variables actually set,
  runtime logs, which branch deploys
- Whether the hardcoded Microsoft Clarity project exists and who owns it

**To close these gaps** a reviewer needs: read access to the Stripe dashboard,
read access to the Supabase project, read access to the Vercel project, and one
Stripe **test-mode** end-to-end purchase.

---

# PART 0 — Reconnaissance

## 0.1 Branches — there is no `main`

**[EXECUTED]** `git ls-remote --symref origin HEAD`:

```
ref: refs/heads/claude/bcba-bookshelf-nav-p63hnv    HEAD
```

The repository's **default branch is `claude/bcba-bookshelf-nav-p63hnv`.** There
is no `main`, no `master`, no `production`.

**[EXECUTED]** Full remote branch list:

| Branch | Head | Role |
|---|---|---|
| `claude/bcba-bookshelf-nav-p63hnv` | `e35dad0` | **Default branch. Source of truth.** |
| `chatgpt/backend-foundation` | `c2276e6` | Orphan. Unrelated history. |
| `claude/bcba-prep-audit-xcjv3t` | `e35dad0` | This audit's branch. |

**[EXECUTED]** `git merge-base` between the two content branches returns **empty**
— `chatgpt/backend-foundation` shares **no common ancestor** with the default
branch. It is a completely separate root. `git diff --stat` between them shows
**40 files changed, 548 insertions, 4,897 deletions** — it is an older, much
smaller variant of the site that predates the member area, testimonials,
sign-in, and the Clarity integration.

Its history also contains eight commits literally titled `No-op sync checkpoint`
and `No-op checkpoint for …`.

> **Finding R-1 — Branch strategy is unsafe for a live store.** Deploying from a
> long-lived, oddly-named feature branch with no `main` means there is no stable
> pointer to "what customers are using." An accidental push to the default branch
> ships straight to production with no review gate. `chatgpt/backend-foundation`
> is a loaded gun: it looks like a real branch but merging it would delete the
> member area, sign-in, testimonials and the robots/noindex protections.
> *(Recommendation in Part 8. No branch operation performed — none is permitted
> without approval.)*

**[EXECUTED]** Last commit: 2026-09-02. All 40+ commits are from `kstring00`
between 2026-09-01 and 2026-09-02.

## 0.2 Framework and structure

**[EXECUTED]** `next build` succeeds.

- **Next.js 16.3.4**, App Router, Turbopack, React 19.2.8, TypeScript 7.0.2
- **[EXECUTED]** Build output: 30 routes. `/api/checkout`, `/api/webhook`,
  `/api/testimonials` and `/testimonials` are dynamic (ƒ); the 9 `/domain/[slug]`
  pages are SSG; **everything else — including `/member` — is static (○)**.
- No `middleware.ts`. No `public/` directory. No `sitemap.ts`.

> **Finding R-2 — `/member` is a static page.** **[EXECUTED]** `curl /member`
> returns **HTTP 200** to an anonymous request. Gating is 100% client-side
> (`app/member/page.tsx:25-34`). This is harmless *today* because the page holds
> no protected content, but it is the wrong foundation for the moment real
> materials arrive. See F-3.

## 0.3 Dependencies

**[EXECUTED]** `npm audit --omit=dev` → **`found 0 vulnerabilities`**.

**[EXECUTED]** `npm outdated` — three trivial patch drifts (`@types/node`,
`@types/react-dom`, `motion` 13.1.1→13.2.0). Nothing unmaintained, nothing with
an advisory.

Runtime dependency list is small and current: `next`, `react`, `react-dom`,
`motion`, `stripe@22.6.1`. **Notably absent: `@supabase/supabase-js`.** All
Supabase access is hand-rolled `fetch` against the REST and Auth endpoints.

> **Finding R-3 — Dependency posture is clean.** This is a genuine strength.

## 0.4 Build and environment variables

**[EXECUTED]** `npm install` → 39 packages, no errors. `npx next build` → success.
`npx next start` → serves on first try.

Environment variables required, **by name only**:

| Name | Consumed at | Required for |
|---|---|---|
| `STRIPE_SECRET_KEY` | `lib/stripe.ts:8` | Checkout + webhook. Throws if unset. |
| `STRIPE_WEBHOOK_SECRET` | `app/api/webhook/route.ts:10` | Webhook. Returns 500 if unset. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | *(declared in `.env.example:11`)* | **Nothing — unused in code.** |
| `NEXT_PUBLIC_SUPABASE_URL` | 4 files | Auth, contact, testimonials |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 4 files | Auth, contact, testimonials |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | `components/MicrosoftClarity.tsx:7` | Analytics |
| `NEXT_PUBLIC_SITE_URL` | `lib/stripe.ts:17` | Checkout success/cancel URLs |
| `RESEND_API_KEY` | `app/api/testimonials/route.ts:28` | Testimonial email alerts |
| `TESTIMONIAL_REVIEW_EMAIL` | `app/api/testimonials/route.ts:29` | Testimonial email alerts |
| `TESTIMONIAL_FROM_EMAIL` | `app/api/testimonials/route.ts:30` | Testimonial email alerts |

> **Finding R-4 — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is documented but never
> read.** **[EXECUTED]** `grep -rn NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY app lib
> components` returns nothing outside `.env.example`. Harmless, but it makes the
> env contract look larger than it is. Cosmetic.

> **Finding R-5 — Supabase URL and publishable key are hardcoded as fallbacks in
> four places.** **[CODE-VERIFIED]** `lib/supabase/auth-client.ts:1-7`,
> `lib/supabase/contact-client.ts:1-7`, `app/api/testimonials/route.ts:3-9`,
> `app/testimonials/page.tsx:7-13`. These are *publishable* browser credentials,
> not secrets — that part is correct and the comments say so accurately. The
> problem is the **`??` fallback pattern**: if the Vercel env var is ever missing,
> misspelled, or scoped to the wrong environment, the app does not fail — it
> **silently connects to the hardcoded project**. A staging deploy would write
> customer contact messages into the production database with no error. Fix by
> removing the fallbacks and throwing on absence. *(Small, safe, but it changes
> failure behavior — proposed, not applied.)*

**Sweep result — no secrets exposed.** **[EXECUTED]**

- `grep -rE 'sk_live|sk_test|whsec_|service_role|SUPABASE_SERVICE|eyJ…'` across
  all tracked source: **zero matches.**
- Same sweep across the built client bundle `.next/static/`: **zero matches.**
- Only Supabase values reaching the browser are the project URL and the
  `sb_publishable_…` key — **[CODE-VERIFIED]** which is the correct, designed-public
  credential.
- **[EXECUTED]** `git log --all --diff-filter=A -- '*.env*'` → only `.env.example`
  was ever committed, and it contains placeholders only.
- **[CODE-VERIFIED]** The service-role key is **not used anywhere in this codebase.**

This is a clean result and deserves to be said plainly: **there is no secret
leakage in this repository.**

---

# PART 1 — THE CORE QUESTION

## 1.1 The chain, link by link

```
Stripe payment → verified webhook → purchase recorded → user account →
domain entitlement → member library → protected material delivered
```

| # | Link | Exists? | Wired to previous? | Evidence |
|---|---|---|---|---|
| 1 | Stripe payment | ✅ Yes | — | `app/api/checkout/route.ts:82-106` **[CODE-VERIFIED]** |
| 2 | Verified webhook | ✅ Yes | ✅ Yes | `app/api/webhook/route.ts:25` **[EXECUTED]** |
| 3 | Purchase recorded | ❌ **No** | ❌ **BREAKS HERE** | `app/api/webhook/route.ts:61-67` **[EXECUTED]** |
| 4 | User account | 🟡 Exists, isolated | ❌ No | `lib/supabase/auth-client.ts` **[CODE-VERIFIED]** |
| 5 | Domain entitlement | ❌ **No** | ❌ No | No code exists. **[EXECUTED]** |
| 6 | Member library | 🟡 Designed only | ❌ No | `app/member/page.tsx:134` **[EXECUTED]** |
| 7 | Protected material | ❌ **No** | ❌ No | No materials, no delivery code. **[EXECUTED]** |

## 1.2 Exactly where it stops

**`app/api/webhook/route.ts`, lines 61–67.**

The webhook verifies the Stripe signature correctly, confirms `payment_status`
is `paid`, extracts the entitlement slugs and the buyer's email — and then does
this:

```ts
console.log("[webhook] paid license", {
  eventId: event.id,
  sessionId: session.id,
  email,
  licenseScope,
  entitlementSlugs,
});
```

**[EXECUTED]** I sent a correctly HMAC-signed `checkout.session.completed` event
to the running app. It returned `{"received":true}` HTTP 200, and the entire
observable effect was one line in the server log.

**[EXECUTED]** `grep -cE 'insert|upsert|INSERT' app/api/webhook/route.ts` → **`0`**.

Nothing is written to any database. On Vercel, that `console.log` lands in the
runtime log, where it is retained for a limited window and is not searchable by
customer email in any practical way for a non-technical owner.

**Link 3 is where the chain stops, and links 5, 6 and 7 do not exist at all.**

## 1.3 Differential access: A, B and C get identical libraries

The test: Customer A buys Domain 3 only. Customer B buys Domain 7 only. Customer
C buys the full library.

**[EXECUTED]** I read every line of `app/member/page.tsx`. There is no query, no
fetch, no conditional, and no reference to entitlements, purchases, or products
anywhere in it. The library section is a **hardcoded literal**:

`app/member/page.tsx:134-139`
```tsx
<h3>No domains connected yet.</h3>
<p>
  Your account layer is active. Once Stripe purchase syncing and
  entitlement fulfillment are connected, the domains licensed to
  this account will appear here automatically.
</p>
```

Below it, `app/member/page.tsx:202-217` renders **all nine domains** to every
signed-in user, from the static `domains` array — as browse links, not as owned
content.

> ## 🔴 **LAUNCH BLOCKER B-1 — There is no entitlement system.**
>
> **Customers A, B and C receive byte-identical pages.** Access is gated only by
> "is there a session in `localStorage`" (`app/member/page.tsx:25-34`). A user who
> has paid nothing and a user who has paid $179 see exactly the same screen.
>
> There is no code in this repository that could produce a different library for
> a different customer. This is not a bug in an entitlement system; **there is no
> entitlement system.**
>
> **Verification:** [EXECUTED] — full read of `app/member/page.tsx`; `grep` for
> `entitlement` across `app/member/` returns zero matches.

**Important context, stated fairly:** this is a **deliberate deferral**, not an
oversight. `BACKEND_HANDOFF.md:41` states *"Manual fulfillment is acceptable
while sales volume is small,"* and `supabase/schema.sql:1-12` is explicitly
headed **"FUTURE ARCHITECTURE ONLY — NOT REQUIRED FOR MVP LAUNCH."** The plan of
record is that **Bryana fulfills each order by hand from the Stripe dashboard.**

That plan is defensible. **The problem is that the manual process was never
built either** — see B-2 — and the site simultaneously ships a member login and
member dashboard that promise automated access. A customer who creates an
account is told *"Your account layer is active"* and shown an empty shelf.

## 1.4 Webhook failure and replay

**Q: What happens if the webhook fails?**

**[CODE-VERIFIED]** Nothing recoverable happens, because nothing was going to be
written anyway. The customer's money is captured by Stripe regardless — Stripe
Checkout completes the payment before the webhook fires. The only durable record
of the sale is **inside Stripe**, which is genuinely a real record: the session
metadata carries `entitlement_slugs`, `license_scope`, `source_product_ids` and
`pricing_tier` (`app/api/checkout/route.ts:91-96`). That is a well-designed
breadcrumb and it means **no sale is truly lost** — but retrieving it requires
someone to open the Stripe dashboard and read session metadata.

**Q: What happens if the webhook arrives twice?**

**[EXECUTED]** I sent the identical signed event three times. All three returned
HTTP 200 and produced **three identical log lines** — no deduplication.

Honest framing: **idempotency is currently moot, because no grant is made.**
There is nothing to double-grant. But the moment fulfillment is built, this must
be unique on `event.id` or `session.id` before any access is granted. The code
comment at `app/api/webhook/route.ts:49-60` already says exactly this, correctly.

**Q: Is there a reconciliation path?**

**[EXECUTED]** No. There is no admin page, no order list, no email to Bryana on a
sale, and no email to the customer beyond Stripe's own receipt.

> ## 🔴 **LAUNCH BLOCKER B-2 — A paying customer's order reaches no human.**
>
> **[CODE-VERIFIED]** On a successful payment: Stripe emails the buyer a receipt
> (if receipts are enabled — **[UNVERIFIED]**, requires Stripe dashboard access).
> The buyer lands on `/thanks`. **Nobody tells Bryana anything.** There is no
> notification, no order email, no dashboard, no queue.
>
> For a manual-fulfillment model, the notification *is* the fulfillment system.
> It does not exist. Bryana would have to remember to check Stripe.
>
> **Verification:** [EXECUTED] — `grep -rn 'resend\|sendMail\|nodemailer\|notify'`
> across `app/api/webhook/` and `app/api/checkout/` returns zero matches. The only
> email code in the repo is the testimonial reviewer alert
> (`app/api/testimonials/route.ts:23-68`), which is unrelated to purchases.

## 1.5 There is nothing to deliver

**[EXECUTED]** A filesystem sweep of the entire repository for `*.pdf`, `*.png`,
`*.jpg`, `*.jpeg`, `*.webp`, `*.docx`, `*.epub`, `*.mp4`, `*.zip`:

```
(no matches)
```

**[EXECUTED]** There is no `public/` directory. **[EXECUTED]** `grep -rn
'storage/v1\|createSignedUrl\|signed_url\|download\|\.pdf'` across `app`,
`components` and `lib` returns nothing.

**[CODE-VERIFIED]** The domain sales page tells the truth about this, to its
credit — `components/DetailView.tsx:81-84`:

> *"The detailed contents of this domain library are being finalized and will be
> listed here as they are loaded into the site."*

> ## 🔴 **LAUNCH BLOCKER B-3 — There is no product.**
>
> The site sells a $29–$179 "personal license to the study materials Bee
> publishes for Domain X." **No such materials exist in this system in any form.**
> Not in the repo, not in a bucket the code knows about, not behind any route.
>
> Even a flawless entitlement system would deliver an empty library. This is the
> single largest gap, and it is a content gap, not an engineering gap — it is
> Bryana's to close, and `README.md:39-44` correctly identifies it as the real
> bottleneck.
>
> **Verification:** [EXECUTED] — full-repo asset sweep and delivery-code grep, both empty.

---

# PART 2 — SYSTEM AUDIT

## 2.1 Stripe

### Price tampering — the highest-severity category

**Result: the server cannot be tricked on price. This is correctly built.**

**[CODE-VERIFIED]** `app/api/checkout/route.ts` reads exactly three things from
the request body, and nothing else. Every property access on client data in the
entire file:

```
line 20:  body = await request.json();
line 25:  const items = Array.isArray(body.items) ? body.items : [];
line 33:  if (typeof item?.productId !== "string")
line 38:  if (Number(item.quantity) !== 1)
line 45:  if (!getProduct(item.productId))
line 52:  productIds.push(item.productId);
```

`body.items[].productId` and `body.items[].quantity`. That is the complete
attack surface. The charged amount comes from:

```
line 56:  const pricing = getLicensePricing(uniqueProductIds);
line 69:  unit_amount: pricing.total,
line 93:  entitlement_slugs: entitlementList,   // from pricing.entitlementSlugs
```

`getLicensePricing` is a pure function over the server-side catalogue in
`lib/products.ts`. **A client-supplied `price`, `unit_amount`, `amount`,
`amount_total`, or `entitlementSlugs` field is never read and cannot influence
the charge or the grant.**

**[EXECUTED]** Live probing of the running app confirms the validation layer:

| Payload | Response |
|---|---|
| `{"items":[{"productId":"module-free-everything","quantity":1}]}` | `400 Unknown product: module-free-everything` |
| `quantity: -5` | `400 Domain licenses may only be purchased once per checkout.` |
| `{"items":[]}` | `400 Cart is empty` |
| `not-json` | `400 Malformed request` |
| Valid product + injected `price:1, unit_amount:1, amount_total:1` | Passed validation, proceeded to Stripe with server pricing |

**[UNVERIFIED]** I could not capture the literal HTTPS request body sent to
Stripe — outbound calls to `api.stripe.com` are blocked by this sandbox's proxy
allowlist, and two attempts to intercept the SDK (module interception, then
`https.request` redirection to a local mock) failed to land because Next.js
bundles the Stripe SDK and the route executes in a process that did not inherit
my preload. **To close this:** run one Stripe **test-mode** checkout and confirm
the resulting session's `amount_total` equals the catalogue price.

Given the grep evidence above, I assess the residual risk here as **very low**.
This is the one thing the codebase most clearly gets right.

### Pricing correctness

**[EXECUTED]** I executed `getLicensePricing` directly across every cart shape:

| Selection | Charged | Regular | Saved | Slugs granted | Tier applied |
|---|---|---|---|---|---|
| 1 domain | $29.00 | $29.00 | $0.00 | 1 | — |
| 2 domains | $58.00 | $58.00 | $0.00 | 2 | — |
| **3 domains** | **$75.00** | $87.00 | $12.00 | 3 | Any 3 domains |
| 4 domains | $104.00 | $116.00 | $12.00 | 4 | 3-pack + 1 |
| **5 domains** | **$115.00** | $145.00 | $30.00 | 5 | Any 5 domains |
| 6 domains | $144.00 | $174.00 | $30.00 | 6 | 5-pack + extras |
| 7 domains | $173.00 | $203.00 | $30.00 | 7 | 5-pack + extras |
| **8 domains** | **$179.00** | $232.00 | $53.00 | **9** | Auto complete-library upgrade |
| **9 domains** | **$179.00** | $261.00 | $82.00 | 9 | Auto complete-library upgrade |
| Bundle | $179.00 | $261.00 | $82.00 | 9 | Complete library |
| Bundle + 1 domain | $179.00 | $261.00 | $82.00 | 9 | Complete library |
| Same domain ×3 | $29.00 | $29.00 | $0.00 | 1 | *(deduplicated)* |

**Every tier matches the advertised pricing** (1 = $29, any 3 = $75, any 5 =
$115, all 9 = $179 — `components/DetailView.tsx:101`). The 8-domain case
correctly upgrades the buyer to all nine for $179, which is *cheaper* than the
math and grants *more* — a deliberate, customer-favourable choice documented at
`lib/products.ts:88-93`. Duplicate line items deduplicate correctly. **No pricing
defects found.**

### Webhook signature verification

**[EXECUTED]** Against the running app with a known webhook secret:

| Test | Result |
|---|---|
| No `stripe-signature` header | `400 Missing signature` ✅ |
| Forged signature `t=1,v1=deadbeef` | `400 Invalid signature` ✅ |
| Correct HMAC-SHA256 signature | `200 {"received":true}` ✅ |

Signature verification is **correct and production-grade**. `runtime = "nodejs"`
is set (`:7`) and the raw body is read with `request.text()` before verification
(`:21`) — both necessary and both right.

### Everything else Stripe

| Item | Status | Evidence |
|---|---|---|
| Success URL | ✅ `/thanks?session_id={CHECKOUT_SESSION_ID}` | `route.ts:89` **[CODE-VERIFIED]** |
| Cancel URL | ✅ `/?cart=open` | `route.ts:90` **[CODE-VERIFIED]** |
| `/thanks` reads `session_id` | ❌ **No.** Param is passed and ignored. | `app/thanks/page.tsx` — static, no `searchParams` **[EXECUTED]** |
| Purchaser email captured | 🟡 Extracted, then only logged | `route.ts:47`, `:61-67` **[EXECUTED]** |
| Duplicate webhook handling | ❌ None | **[EXECUTED]** 3 identical deliveries → 3 log lines |
| `charge.refunded` handling | ❌ Not handled | **[CODE-VERIFIED]** only `checkout.session.completed` at `:31` |
| `charge.dispute.created` | ❌ Not handled | same |
| `payment_intent.payment_failed` | ❌ Not handled | same |
| `checkout.session.expired` | ❌ Not handled | same |
| Tax handling | ❌ Not configured | No `automatic_tax` in `sessions.create`. Open decision flagged at `route.ts:8-13` **[CODE-VERIFIED]** |
| Test vs live mode | **[UNVERIFIED]** | Determined entirely by which `STRIPE_SECRET_KEY` is in Vercel. **Requires dashboard access.** |
| Webhook endpoint registered | **[UNVERIFIED]** | **Requires Stripe dashboard access.** |
| Receipt delivery | **[UNVERIFIED]** | Stripe setting, not code. `/thanks` promises one (`:11-13`). **Requires dashboard access.** |
| Refund path | 🟡 Stripe-side only | Refunding in Stripe works; nothing in the app reacts. |
| Error leakage | ✅ Good | Raw Stripe errors are caught and never echoed (`route.ts:107-114`) **[CODE-VERIFIED]** |

> **Finding S-1 — `/thanks` ignores the session it is handed.** The success URL
> passes `session_id`, and the page does nothing with it. Retrieving the session
> server-side would let the page show the buyer what they bought and what happens
> next — the natural place to fix B-4.

> **Finding S-2 — No `charge.refunded` / `dispute` / `payment_failed` handling.**
> Low impact *today* (no entitlements to revoke), but the day access is granted,
> a refunded customer keeps their access forever unless this is added.

## 2.2 Customer accounts

**[CODE-VERIFIED]** Implemented as raw `fetch` calls against Supabase's GoTrue
endpoints in `lib/supabase/auth-client.ts` — no SDK.

| Feature | Status | Evidence |
|---|---|---|
| Sign up | 🟡 Implemented | `auth-client.ts:87-100` **[CODE-VERIFIED]**; live behavior **[UNVERIFIED]** |
| Sign in | 🟡 Implemented | `auth-client.ts:72-85` **[CODE-VERIFIED]** |
| Email confirmation | 🟡 Handled if Supabase requires it | `sign-in/page.tsx:46-52` branches on absence of a session **[CODE-VERIFIED]**; whether confirmation is enabled is **[UNVERIFIED]** |
| Password reset | 🟡 Request only | `auth-client.ts:102-106` **[CODE-VERIFIED]**. **No `/reset-password` route exists** — see A-1 |
| Session storage | ⚠️ `localStorage` | `auth-client.ts:37-44` **[CODE-VERIFIED]** |
| Session refresh | ✅ Implemented, 60s skew | `auth-client.ts:127-151` **[CODE-VERIFIED]** |
| Sign out | ✅ Implemented, fails safe | `auth-client.ts:158-176` — clears local state even if the network call fails **[CODE-VERIFIED]** |
| Invalid credentials | 🟡 Surfaces raw Supabase message | `sign-in/page.tsx:53-58` **[CODE-VERIFIED]** |
| Duplicate account | **[UNVERIFIED]** | Depends on Supabase config. **Requires a live signup test.** |
| Account enumeration | **[UNVERIFIED]** | Error text passes straight through from Supabase (`auth-client.ts:46-54`); whether it distinguishes "no such user" from "wrong password" **requires a live test.** |

> ## 🔴 **LAUNCH BLOCKER A-1 — Password reset is a dead end.**
>
> **[EXECUTED]** `requestPasswordReset` (`auth-client.ts:102-106`) calls Supabase's
> `/auth/v1/recover`, and the UI reports *"Password reset email sent. Check your
> inbox for the next step."* (`sign-in/page.tsx:75`).
>
> **There is no route in this application that can complete a password reset.**
> The build output lists 30 routes; none is `/reset-password`, `/update-password`,
> or an auth callback. A customer who clicks the link in that email arrives at a
> URL this site does not serve.
>
> Locked-out paying customers is a support disaster and a refund driver.
>
> **Verification:** [EXECUTED] — full route list from `next build`; `grep -rn
> 'recover\|reset-password\|updateUser\|type=recovery' app/` finds only the
> *request* side.

> **Finding A-2 — Sessions live in `localStorage`, not cookies.**
> **[CODE-VERIFIED]** `auth-client.ts:40-43`. Consequences: (a) tokens are readable
> by any script on the origin, so any future XSS becomes full account takeover;
> (b) the server can never know who is signed in, which is *why* `/member` must be
> client-gated. Acceptable while nothing is protected. **Must be revisited before
> any paid material is served.** Not a launch blocker today only because there is
> nothing behind the gate.

## 2.3 Supabase

**This is the section with the most UNVERIFIED entries, and I want to be blunt
about why: I have no idea whether the Supabase project is even provisioned.**

**[EXECUTED]** All REST probes to the project return `000` — the sandbox proxy
refuses the connection (`CONNECT tunnel failed, response 403`). I could not read
a single row, policy, or table definition.

**[CODE-VERIFIED]** What the repo tells us:

- `supabase/schema.sql:1-12` is headed **"FUTURE ARCHITECTURE ONLY — NOT REQUIRED
  FOR MVP LAUNCH"** and states **"No BCBA Prep Supabase project is connected by
  this file."**
- `BACKEND_HANDOFF.md:53-58` lists the entire Supabase model under **"Keep as
  architecture documentation only"** and `:62` explicitly postpones *"Supabase
  project provisioning."*
- Yet **[CODE-VERIFIED]** four files hardcode a real-looking project ref and
  publishable key and the app actively calls that project for auth, contact
  messages, and testimonials.

**These two facts contradict each other.** The docs say Supabase is not
provisioned; the code depends on a specific live project for three features.

| Item | Status | Evidence |
|---|---|---|
| Auth config | **[UNVERIFIED]** | Code targets `/auth/v1/*`. Whether the project exists, and whether email confirmation is on, **requires project access.** |
| `contact_messages` table | **[UNVERIFIED]** | Written to from the **browser** (`contact-client.ts:17`). Existence and RLS **require project access.** |
| `testimonials` table | **[UNVERIFIED]** | Read+written by `app/api/testimonials/route.ts` and `app/testimonials/page.tsx`. Schema in `schema.sql:187-208` uses `is_published`; **the code uses `status: 'pending'`** — the two do not agree, so the running table (if any) is not the one in this file. |
| `entitlements` / `purchases` / `purchase_items` / `member_profiles` / `materials` | ⚪ Schema file only | **[EXECUTED]** `grep -rn 'entitlements\|purchases\|materials' app lib components` → **zero references in application code.** These tables are inert SQL. |
| Storage bucket `materials` | ⚪ Schema file only, `public = false` | `schema.sql:213-215` **[CODE-VERIFIED]**. Whether it exists **[UNVERIFIED]**. No code references storage. |
| RLS enabled | **[UNVERIFIED]** | `schema.sql` enables RLS on every table it defines, and its policies are well-written (owner-scoped, `security invoker`, no `user_metadata` trust). **But this file is documentation, not necessarily the live schema.** |
| Service-role key misuse | ✅ **None** | **[EXECUTED]** Zero occurrences anywhere in the repo or client bundle. |

### The two questions asked specifically

**Q: Is any paid material sitting in a public bucket or reachable by direct URL?**

**No — [EXECUTED], with high confidence.** There is no paid material anywhere
(see B-3), no `public/` directory, and no storage code path. The risk is
currently zero because the asset count is zero.

**Q: Is the service role key used anywhere reachable from the client?**

**No — [EXECUTED].** It appears nowhere in the repository or the built client
bundle. This is correct and worth crediting.

> ## 🔴 **LAUNCH BLOCKER D-1 — Contact and testimonial writes go directly from
> the browser using the publishable key.**
>
> **[CODE-VERIFIED]** `lib/supabase/contact-client.ts:17-32` POSTs to
> `/rest/v1/contact_messages` from the customer's browser, authenticated with the
> publishable key that ships in the client bundle.
>
> Anyone can extract that key from the page source and POST directly to the table
> — bypassing the form entirely. **[CODE-VERIFIED]** There is no honeypot, no rate
> limit, no CAPTCHA, and no server-side route in front of it. The only defence is
> whatever RLS policy exists on that table, which is **[UNVERIFIED]**.
>
> A single scripted loop could insert millions of rows and exhaust the Supabase
> free tier, taking the contact form (and possibly auth) down with it.
>
> The testimonial path is better — it *does* go through a server route
> (`app/api/testimonials/route.ts`) with a honeypot at `:99-101` and real
> validation — but that route **also** uses the publishable key
> (`:140-147`), so the same direct-to-REST bypass exists for `testimonials`.
>
> **Fix:** route contact through a server API route, and give both routes a rate
> limit. **[UNVERIFIED]** whether RLS currently mitigates this — **requires project
> access to confirm.**

## 2.4 Content protection

Framing this precisely, because it matters commercially and legally.

**Screenshots and copying cannot be prevented.** Any customer who can read a
document can photograph it. Nothing in this or any other codebase changes that,
and `README.md:51` correctly says *"Do not build fake screenshot prevention."*
What follows is about **technical and contractual safeguards against
unauthorized redistribution and resale.**

| Layer | Present today | Evidence |
|---|---|---|
| **Technical access control** | ❌ **None** | No entitlement checks; no protected route; no signed URLs; no materials. `/member` is client-gated only. **[EXECUTED]** |
| **Watermarking / identity linkage** | ❌ **None** | **[EXECUTED]** `grep -rn 'watermark' .` → zero matches. Nothing could tie a leaked file to a buyer. |
| **Contractual licensing** | ✅ **Genuinely good** | `app/terms/page.tsx:26-33` prohibits resale, redistribution, upload to shared drives, and credential sharing, in clear language. Checkout stamps `license_scope: personal_non_transferable` into Stripe metadata (`checkout/route.ts:74, 92`), creating a per-transaction record of the licence terms — a real evidentiary asset. **[CODE-VERIFIED]** |
| **Requires an attorney** | ⚠️ | Enforceability, DMCA process, jurisdiction, and consumer-law limits on the final-sale refund term are legal questions. Neither I nor the code can answer them. |

**Honest summary:** the *contractual* layer is in place and well drafted. The
*technical* layer is entirely absent. Since no material is delivered yet, there
is nothing to leak — this is a "before you ship content" problem, not a "before
you take a payment" problem.

## 2.5 Storefront

**[EXECUTED]** Every route probed on the running production build:

| Route | HTTP | Notes |
|---|---|---|
| `/` | 200 | Homepage / bookshelf |
| `/domain/{9 slugs}` | 200 | All 9 present, SSG |
| `/domain/does-not-exist` | 404 | ✅ Correct |
| `/about` | 200 | ⚠️ 6 visible `[[TODO_]]` tokens |
| `/contact` | 200 | |
| `/testimonials` | 200 | |
| `/sign-in` | 200 | |
| `/member` | 200 | ⚠️ Served to anonymous users |
| `/thanks` | 200 | ⚠️ Visible `[[TODO_DELIVERY_NOTE]]` |
| `/privacy` | 200 | ⚠️ Visible `[[TODO_PRIVACY]]` |
| `/terms` | 200 | ✅ Real content |
| `/refunds` | 200 | ✅ Real content |
| `/blog` `/updates` `/resources` `/study-guides` `/mock-exams` | 200 | ⚠️ **Entirely placeholder** |
| `/nope-404` | 404 | ✅ Correct |
| `/robots.txt` | 200 | `Disallow: /` |
| `/sitemap.xml` | 404 | None exists |

**Cart and bundle display:** ✅ Correct. **[CODE-VERIFIED]** `lib/cart-context.tsx`
enforces one licence per domain (`:54-56`), makes the bundle mutually exclusive
with individual domains (`:49-53`), and derives all displayed totals from the
same `getLicensePricing` the server uses (`:80-83`) — so the cart total and the
charged amount cannot drift apart.

> ## 🔴 **LAUNCH BLOCKER C-1 — Placeholder tokens are visible to customers.**
>
> **[EXECUTED]** Rendered HTML from the running server contains these literal
> strings on these public pages:
>
> | Page | Visible tokens |
> |---|---|
> | `/thanks` | `[[TODO_DELIVERY_NOTE]]` — **on the page shown immediately after payment** |
> | `/privacy` | `[[TODO_PRIVACY]]` — **the entire policy body** |
> | `/about` | `[[TODO_STAT_YEARS]]`, `[[TODO_STAT_STUDENTS]]`, `[[TODO_STAT_RESOURCES]]`, `[[TODO_STAT_FRAMEWORK]]`, `[[TODO_PORTRAIT_BEE]]`, `[[TODO_IMAGE_STUDIO]]` |
> | `/blog` `/updates` `/resources` `/study-guides` `/mock-exams` | Title **and** body on all five |
>
> The `/thanks` one is the worst thing on the site: a customer hands over $179
> and the confirmation page shows them a broken template variable.
>
> The five orphan pages are not in the header nav (`SiteHeader.tsx:11-16`) or
> footer (`Footer.tsx:33-38`), but they are prerendered, return 200, and are
> reachable by URL or by a stale link.

> ## 🔴 **LAUNCH BLOCKER C-2 — The Privacy page has no privacy policy.**
>
> `app/privacy/page.tsx:10` is `<p>[[TODO_PRIVACY]]</p>`.
>
> The page does have real, accurate sections on Stripe, Clarity, and the cart —
> and **[CODE-VERIFIED]** the cart claim at `:33-37` (*"held in memory for the
> length of your visit only… not written to your device"*) is **true**, matching
> `lib/cart-context.tsx:40` which uses `useState` with no persistence. Credit
> where due.
>
> But the policy proper is absent, and it fails to disclose three things the site
> actually does: it stores account emails in Supabase, it stores contact-form
> submissions and testimonial submitter emails in Supabase, and it writes an auth
> session to the visitor's browser `localStorage` (`auth-client.ts:40`).
>
> Taking payments and collecting emails behind a placeholder privacy policy is a
> legal exposure, not a cosmetic one.

> ## 🔴 **LAUNCH BLOCKER C-3 — The refund policy contradicts the system.**
>
> `app/refunds/page.tsx:10-14`: *"all purchases are final and non-refundable."*
>
> **[EXECUTED]** Combined with B-1, B-2 and B-3, this means: a customer pays,
> receives no materials (because none exist), has no way to reach their purchase,
> and is told in writing that sales are final.
>
> The page's *"If something is not right"* section (`:24-31`) is a genuinely
> decent good-faith clause and partly mitigates this. But a final-sale policy
> attached to an undeliverable product is the fact pattern that produces
> chargebacks — and chargebacks, at volume, get Stripe accounts frozen.
>
> **This blocker resolves itself the moment B-3 is fixed.** It is listed because
> shipping C-3 *without* fixing B-3 is the single most dangerous combination on
> this site.

## 2.6 Forms

### Contact form

| Aspect | Status | Evidence |
|---|---|---|
| Client validation | ✅ Good | `required`, `type=email`, `minLength`/`maxLength` on all four fields — `contact/page.tsx:88-136` **[CODE-VERIFIED]** |
| Server validation | ❌ **None** | Posts straight to Supabase REST. No server route. **[CODE-VERIFIED]** |
| Spam protection | ❌ **None** | No honeypot, no rate limit, no CAPTCHA. **[CODE-VERIFIED]** |
| Success state | ✅ Present | `:139-143` |
| Error state | ✅ Present | `:138` |
| **Where does it arrive?** | 🔴 **A database table only** | `contact-client.ts:17` |

> ## 🔴 **LAUNCH BLOCKER F-1 — Contact messages arrive nowhere a human will look.**
>
> **[CODE-VERIFIED]** A submitted message is inserted into a Supabase table called
> `contact_messages` and **that is all that happens**. No email. No notification.
> No inbox. No admin page. There is no code anywhere in this repository that reads
> that table.
>
> To see a customer message, Bryana would have to sign in to Supabase, open the
> Table Editor, find the table, and read rows — assuming the table exists
> (**[UNVERIFIED]**) and that she has an account on that project
> (**VERIFY WITH KYLE**).
>
> Meanwhile the page tells customers: *"Bee can review it from the BCBA Prep
> contact inbox"* (`contact/page.tsx:141`) and *"Send a note and Bee can review it
> from the BCBA Prep contact inbox"* (`:59-60`). **There is no inbox.**
>
> This is worse than having no contact form: customers with purchase problems will
> use it, receive a success message, and be ignored.

### Testimonial submission

| Aspect | Status | Evidence |
|---|---|---|
| Server-side validation | ✅ **Good** | `api/testimonials/route.ts:103-138` **[EXECUTED]** |
| Honeypot | ✅ Present, correctly silent | `:99-101` **[EXECUTED]** — bot payload returns `200 {"received":true}` without inserting |
| Consent capture | ✅ Required | `:133-138` |
| Reviewer email alert | 🟡 Coded, unconfigured | `:23-68`. No-ops unless `RESEND_API_KEY` + 2 more vars are set — **[UNVERIFIED]** whether they are |
| Rate limiting | ❌ None | **[CODE-VERIFIED]** |

**[EXECUTED]** Validation results against the live route:

| Input | Response |
|---|---|
| Honeypot `company` filled | `200 {"received":true}` (silently discarded) ✅ |
| Empty display name | `400 Please enter the name you want displayed.` ✅ |
| `email: "nope"` | `400 Please enter a valid email address.` ✅ |
| 5-character quote | `400 Please write between 20 and 1,200 characters.` ✅ |
| `consent: false` | `400 Please confirm that Bee may publish your testimonial…` ✅ |

This is the best-validated input path in the codebase. But:

> ## 🔴 **LAUNCH BLOCKER F-2 — "Every testimonial is reviewed before it is
> published" is false.**
>
> The public page states, at `app/testimonials/page.tsx:81`:
> *"Every testimonial below is reviewed before it is published."*
>
> **[EXECUTED]** Submissions are inserted with `status: "pending"`
> (`api/testimonials/route.ts:153`). The page then reads them back with:
>
> ```
> app/testimonials/page.tsx:33
> /rest/v1/testimonials?select=id,display_name,quote,created_at&order=created_at.desc&limit=16
> ```
>
> **There is no `status` filter on that query.** The identical unfiltered query
> appears again at `api/testimonials/route.ts:72`. The function is even *named*
> `getApprovedTestimonials` (`:30`) while filtering nothing.
>
> If the `testimonials` table permits anonymous reads — which it must, for the
> page to display anything — **every submission publishes to the live site
> immediately, unmoderated.** Anyone on the internet can put arbitrary text, up to
> 1,200 characters, on Bryana's testimonials page under a name of their choosing.
>
> There is also no admin UI to approve anything, so no moderation could occur even
> if the filter existed.
>
> **Fix:** add a status filter to both queries and build an approval step.
> **[UNVERIFIED]** whether RLS currently blocks anonymous reads of pending rows —
> **requires project access.** I did not apply the one-line filter fix because the
> correct column name and approved-state value depend on the live schema, which I
> cannot see, and a wrong guess would silently blank the page.

> **Finding F-3 — Testimonial submitter emails are stored.** `:152` inserts
> `email`. If RLS permits anonymous `SELECT` on that table (plausible, since the
> page reads it anonymously), submitter email addresses may be readable by anyone
> with the publishable key. **[UNVERIFIED] — requires project access.** The
> application's own queries do not select `email`, so this is a policy question,
> not a code question.

## 2.7 Security sweep

| Check | Result | Evidence |
|---|---|---|
| Secrets in repo | ✅ **Clean** | **[EXECUTED]** full-source regex sweep, zero matches |
| Secrets in client bundle | ✅ **Clean** | **[EXECUTED]** sweep of `.next/static/`, zero matches |
| Secrets in `NEXT_PUBLIC_` | ✅ **Clean** | Only the Supabase URL + publishable key, both designed-public **[CODE-VERIFIED]** |
| `.env` ever committed | ✅ **Never** | **[EXECUTED]** `git log --diff-filter=A -- '*.env*'` → only `.env.example` |
| Trusting browser pricing | ✅ **Does not** | **[CODE-VERIFIED]** see §2.1 |
| Trusting browser entitlements | ✅ **Does not** | `checkout/route.ts:62` derives from server catalogue **[CODE-VERIFIED]** |
| Webhook signature bypass | ✅ **Not possible** | **[EXECUTED]** unsigned → 400, forged → 400 |
| Service-role key misuse | ✅ **None** | **[EXECUTED]** |
| API route authorization | 🟡 N/A by design | All three routes are intentionally public. None returns user data. |
| Publicly reachable paid assets | ✅ **None exist** | **[EXECUTED]** |
| Missing RLS | **[UNVERIFIED]** | **Requires project access.** |
| Account enumeration | **[UNVERIFIED]** | Raw Supabase errors are surfaced (`auth-client.ts:46-54`). **Requires a live test.** |
| Server/client boundary leakage | ✅ **Clean** | **[CODE-VERIFIED]** `lib/stripe.ts` is never imported by a `"use client"` file |
| Security headers | ❌ **None** | **[EXECUTED]** no HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy |
| Unmoderated public content | 🔴 **Yes** | F-2 |
| Unrate-limited public writes | 🔴 **Yes** | D-1 |

> **Finding SEC-1 — No security headers.** `next.config.ts:5-17` sets exactly one
> header, `X-Robots-Tag`. Adding a baseline set is low-risk and quick. Not a
> launch blocker for a Stripe-hosted checkout (card data never touches this
> origin), but it should be done.

## 2.8 Accessibility

**[EXECUTED]** — real Chromium, real keyboard events, computed styles.

| Check | Result |
|---|---|
| Form labels | ✅ **Perfect.** `/contact` 4/4, `/sign-in` 2/2, `/testimonials` 5/5 — every field wrapped in a `<label>`, zero unlabelled |
| Tab order | ✅ **Logical.** Brand → Home → About → Testimonials → Contact → Member Login → Cart → Member Login |
| Focus ring on links/buttons | ✅ Present (`outline: auto 1px`) |
| `prefers-reduced-motion` | ✅ **Well handled.** Honored in `globals.css:1728`, `testimonials.module.css:514`, `BookEnhancements.module.css:164`, plus `useReducedMotion` in 6 components including `AddToCart` and `CartPanel` |
| Images missing `alt` | ✅ **Zero** — the site uses inline SVG only, no `<img>` at all |
| Heading structure | ✅ Exactly one `<h1>` per page (domain pages via `DetailView.tsx:69`) |
| Touch targets | ✅ **Good.** Checkout button 46px, sign-in submit 56px, form inputs 52px min-height |
| Skip link | ❌ **[EXECUTED]** none exists |
| Focus indicator contrast | ⚠️ **Too weak** — see A11Y-1 |
| Cart panel semantics | ⚠️ **Not a dialog** — see A11Y-2 |

> **Finding A11Y-1 — The form focus indicator is present but far too faint.**
> **[EXECUTED]** `contact.module.css:184` sets `outline: none`, and `:204-210`
> replaces it with `box-shadow: 0 0 0 4px rgba(169, 140, 176, 0.1)`. Measured on
> a real Tab press after the 160ms transition settles:
>
> - Focus ring vs. page background: **1.09:1**
> - Focused border vs. field background: **2.97:1**
>
> WCAG 2.2 SC 2.4.11 (Focus Appearance) requires **3:1**. Both fall short; the
> ring is essentially invisible. Same pattern at `sign-in.module.css:216` and
> `testimonials.module.css:370`. **This is on the sign-in form** — the path to the
> member area. Raising the alpha from `0.1` to roughly `0.45` would clear it.
>
> *(An earlier reading of mine showed no indicator at all; that was a measurement
> taken mid-transition. The indicator exists — it is weak, not absent.)*

> **Finding A11Y-2 — The cart panel is not an accessible dialog.** **[EXECUTED]**
> On open: `role` is `null`, `aria-modal` is `null`, focus does **not** move into
> the panel, and **Escape does not close it**. It does have `aria-label="Cart"`.
> This is the checkout entry point, so it matters more than its size suggests.

## 2.9 Responsive QA

**[EXECUTED]** — real Chromium at each width, completing an actual purchase flow
(add licence → open cart → read total → locate checkout button), not just
screenshotting.

| Width | Horizontal overflow | Cart total | Checkout button | Button height | JS errors |
|---|---|---|---|---|---|
| 375px | **0px** | $29 | ✅ visible | 46px | 0 |
| 390px | **0px** | $29 | ✅ visible | 46px | 0 |
| 768px | **0px** | $29 | ✅ visible | 46px | 0 |
| 1024px | **0px** | $29 | ✅ visible | 46px | 0 |
| 1440px | **0px** | $29 | ✅ visible | 46px | 0 |

**Sign-in at 375px [EXECUTED]:** 0px overflow, both fields fillable, submit
button visible at 56px height.

> **Finding RESP-1 — Responsive implementation is excellent.** Zero overflow at
> every tested width, zero JavaScript errors, purchase flow completable on a
> 375px phone, touch targets above 44px. The animation work (`AddToCart.tsx`,
> `Book.tsx`) does not break the layout at any size. **This is the strongest area
> of the project and needs no work.**

## 2.10 SEO and launch settings

**Indexing is currently disabled, deliberately, in three coordinated places.**
**[CODE-VERIFIED]** and cross-referenced — each location's comment points at the
other two, which is careful work:

1. `next.config.ts:10-14` — `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex` on every path. **[EXECUTED]** confirmed on the live response.
2. `app/layout.tsx:51-63` — `robots: { index: false, follow: false, … }` metadata.
3. `app/robots.ts:13-19` — `Disallow: /`. **[EXECUTED]** confirmed at `/robots.txt`.

| Item | Status |
|---|---|
| Metadata (title/description) | ✅ Set at root, real copy `layout.tsx:31-36` |
| Open Graph | 🟡 Title/description/type/siteName set; **no `og:image`** `layout.tsx:37-42` |
| Twitter card | 🟡 `summary_large_image` declared with **no image** `layout.tsx:43-47` |
| Favicon | ✅ `app/icon.svg` |
| Canonical URLs | ❌ None |
| Sitemap | ❌ **[EXECUTED]** `/sitemap.xml` → 404 |
| Per-page metadata | 🟡 Most pages set a title; **the 9 domain product pages do not** — no `generateMetadata` in `app/domain/[slug]/page.tsx`, so all nine share the root title |

> **Finding SEO-1 — The nine product pages have identical titles and
> descriptions.** These are the money pages. `generateMetadata` on
> `app/domain/[slug]/page.tsx` is a small, high-value addition.

### Launch-day switch list

Everything that must be flipped, in order:

1. `next.config.ts:10-14` — remove the `X-Robots-Tag` header block
2. `app/layout.tsx:51-63` — remove the `robots` metadata block
3. `app/robots.ts` — replace `disallow: "/"` with an allow rule
4. Add `app/sitemap.ts`
5. Add `generateMetadata` to `app/domain/[slug]/page.tsx`
6. Add an OG image
7. Switch `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to live values in Vercel
8. Register the live webhook endpoint in Stripe and confirm it delivers
9. Set `NEXT_PUBLIC_SITE_URL` to the production domain
10. Confirm Stripe receipt emails are enabled

## 2.11 Analytics

**[CODE-VERIFIED]** `components/MicrosoftClarity.tsx` is fully implemented,
mounted globally at `app/layout.tsx:92`, loads with `strategy="afterInteractive"`,
and validates the project ID against `/^[a-zA-Z0-9]+$/` before rendering
(`:9-14`) — it fails closed rather than injecting a broken tag.

A **hardcoded project ID fallback** is present at `:7`, so Clarity is active in
production whether or not `NEXT_PUBLIC_CLARITY_PROJECT_ID` is set. (The value is
a public tracking identifier, not a secret; it is not reproduced in this
document. It lives at `components/MicrosoftClarity.tsx:7`.)

**[UNVERIFIED]** Whether that Clarity project exists, whether it is collecting
data, and **who owns the Microsoft account it belongs to**. **Requires Clarity
dashboard access — see `CLIENT_OWNERSHIP_HANDOFF.md`.**

Once live, Bryana would see: visitor counts, session recordings, heatmaps, and
rage/dead-click detection. **[CODE-VERIFIED]** No custom events, no funnel, and
no purchase tracking are implemented — so Clarity will show *how people move*,
never *what they bought*.

Note: `app/privacy/page.tsx:19-31` already discloses Clarity accurately,
including session recordings. Good.

## 2.12 Deployment

**Almost everything here is [UNVERIFIED]** — this repository contains no
`vercel.json`, no CI workflow, and no deployment configuration of any kind.
**[EXECUTED]** `find . -name 'vercel.json' -o -name '.github'` → nothing.

| Item | Status |
|---|---|
| Build succeeds | ✅ **[EXECUTED]** |
| Vercel production deployment | **[UNVERIFIED]** — requires Vercel access |
| Production domain / DNS | **[UNVERIFIED]** — requires Vercel + registrar access |
| Env vars present in Vercel | **[UNVERIFIED]** — requires Vercel access |
| Runtime errors in logs | **[UNVERIFIED]** — requires Vercel access |
| Which branch deploys | **[UNVERIFIED]**; the repo default is `claude/bcba-bookshelf-nav-p63hnv`. Commit `fbee249` *("Trigger Pro deployment from latest member dashboard")* suggests Vercel is connected to it |
| Branch strategy | 🔴 See R-1 |

---

# PART 3 — CLASSIFICATION TABLE

Legend: ✅ Production ready · 🟡 Partially functional · 🔴 Not functional · ⚪ Future feature

| Feature | Status | What works | What does not | Launch blocker? | Verification | Recommended action |
|---|---|---|---|---|---|---|
| **Server-side pricing** | ✅ | Amount derived only from `lib/products.ts`; client price fields never read | — | No | [CODE-VERIFIED] + [EXECUTED] | Confirm with one test-mode purchase |
| **Bundle pricing math** | ✅ | All 12 cart shapes match advertised tiers; 8-domain auto-upgrade correct | — | No | [EXECUTED] | None |
| **Checkout input validation** | ✅ | Unknown product, bad quantity, empty cart, malformed JSON all rejected | — | No | [EXECUTED] | None |
| **Webhook signature verification** | ✅ | Unsigned → 400; forged → 400; valid → 200; raw body + Node runtime correct | — | No | [EXECUTED] | None |
| **Responsive layout** | ✅ | 0px overflow at 375/390/768/1024/1440; purchase flow works at 375px; 0 JS errors | — | No | [EXECUTED] | None |
| **Form labels / alt text** | ✅ | 11/11 fields labelled; no `<img>` without alt (site is inline SVG) | — | No | [EXECUTED] | None |
| **Reduced-motion support** | ✅ | CSS media queries + `useReducedMotion` in 6 components | — | No | [EXECUTED] | None |
| **Dependency health** | ✅ | 0 vulnerabilities; all current | — | No | [EXECUTED] | None |
| **Secret hygiene** | ✅ | Nothing in repo, bundle, or git history; no service-role key | — | No | [EXECUTED] | None |
| **Cart** | ✅ | One licence per domain; bundle exclusivity; totals from same function as server | Not persisted across reload *(documented as intentional)* | No | [CODE-VERIFIED] | None |
| **Terms of sale** | ✅ | Real, specific, covers licence scope, resale, sharing, no-outcome-guarantee | — | No | [CODE-VERIFIED] | Attorney review |
| **Noindex / pre-launch lockout** | ✅ | Three coordinated layers, all confirmed live | — | No | [EXECUTED] | Flip on launch day |
| **Domain product pages (×9)** | 🟡 | Render, price, add-to-cart, honest about contents being unfinalized | No per-page metadata; no contents listed | No | [EXECUTED] | Add `generateMetadata` |
| **Stripe Checkout session** | 🟡 | Session created with correct amount + rich metadata | Live/test mode unconfirmed; no tax; no receipt confirmation | No | [CODE-VERIFIED] / [UNVERIFIED] | Verify in dashboard |
| **Sign up / sign in / sign out** | 🟡 | Implemented against Supabase GoTrue; refresh with skew; fail-safe sign-out | Live behavior unconfirmed; `localStorage` sessions; enumeration unknown | No | [CODE-VERIFIED] | Live test |
| **Password reset** | 🟡 | Request sends | **No route completes it** | 🔴 **YES (A-1)** | [EXECUTED] | Build `/reset-password` |
| **Testimonial submission** | 🟡 | Best validation in the codebase; honeypot works; consent required | No rate limit; reviewer email unconfigured | No | [EXECUTED] | Configure Resend vars |
| **Testimonial display** | 🔴 | Renders whatever the table returns | **No moderation filter**; claims moderation that does not happen | 🔴 **YES (F-2)** | [EXECUTED] | Add status filter + approval step |
| **Contact form** | 🔴 | Validates and submits; good success/error states | **Arrives in a DB table nobody reads**; no spam protection; browser writes direct to Supabase | 🔴 **YES (F-1, D-1)** | [CODE-VERIFIED] | Server route + email delivery |
| **Purchase → account link** | 🔴 | — | **Does not exist** | 🔴 **YES (B-1)** | [EXECUTED] | Persist purchases |
| **Entitlements** | 🔴 | — | **No code. Schema file only.** A, B and C get identical access | 🔴 **YES (B-1)** | [EXECUTED] | Build after content exists |
| **Fulfillment (any kind)** | 🔴 | Stripe metadata records what was bought | **Webhook only `console.log`s. Nobody is notified.** | 🔴 **YES (B-2)** | [EXECUTED] | Order-notification email |
| **Study materials** | 🔴 | — | **Zero files exist anywhere** | 🔴 **YES (B-3)** | [EXECUTED] | Bryana authors content |
| **Member library** | 🔴 | Beautiful dashboard shell; correct redirect when signed out | Hardcoded "No domains connected yet"; shows all 9 as browse links | 🔴 **YES (B-1)** | [EXECUTED] | Wire to entitlements |
| **`/thanks` page** | 🔴 | Renders; tells buyer a receipt is coming | Shows `[[TODO_DELIVERY_NOTE]]`; ignores `session_id` | 🔴 **YES (C-1)** | [EXECUTED] | Write real copy |
| **Privacy policy** | 🔴 | Stripe/Clarity/cart sections are real and accurate | **Policy body is `[[TODO_PRIVACY]]`**; omits Supabase + localStorage | 🔴 **YES (C-2)** | [EXECUTED] | Write it; attorney review |
| **Refund policy** | 🔴 | Well-written; good-faith clause | **Says "final sale" for an undeliverable product** | 🔴 **YES (C-3)** | [CODE-VERIFIED] | Resolve with B-3 |
| **About page** | 🔴 | Layout and section copy are real | 6 visible `[[TODO_]]` tokens including 4 stat figures | 🔴 **YES (C-1)** | [EXECUTED] | Bryana supplies figures |
| **`/blog` `/updates` `/resources` `/study-guides` `/mock-exams`** | 🔴 | Return 200 | **100% placeholder tokens** | 🔴 **YES (C-1)** | [EXECUTED] | Delete the routes |
| **Content protection (technical)** | 🔴 | — | No access control, no signed URLs, no watermarking | No *(nothing to protect yet)* | [EXECUTED] | Build with entitlements |
| **Content protection (contractual)** | ✅ | Terms prohibit resale/sharing; `license_scope` stamped per transaction | — | No | [CODE-VERIFIED] | Attorney review |
| **Security headers** | 🔴 | Only `X-Robots-Tag` | No CSP/HSTS/X-Frame-Options/etc. | No | [EXECUTED] | Add baseline set |
| **Focus indicator (forms)** | 🟡 | Indicator exists | 1.09:1 ring, 2.97:1 border — both under WCAG 3:1 | No | [EXECUTED] | Raise alpha |
| **Cart panel a11y** | 🟡 | Has `aria-label` | No `role="dialog"`, no focus trap, **Escape does not close** | No | [EXECUTED] | Add dialog semantics |
| **Microsoft Clarity** | 🟡 | Fully implemented; fails closed on bad ID; hardcoded ID means it is live | Project existence and ownership unknown; no purchase events | No | [CODE-VERIFIED] / [UNVERIFIED] | Confirm ownership |
| **SEO / sitemap / OG image** | 🟡 | Root metadata, OG tags, favicon | No sitemap, no canonicals, no OG image, no per-product metadata | No | [EXECUTED] | Launch-day list §2.10 |
| **Branch / deploy strategy** | 🔴 | Builds and deploys | No `main`; deploys from a feature branch; orphan branch would delete features | No *(process risk)* | [EXECUTED] | Establish `main` |
| **`README.md` accuracy** | 🔴 | Excellent engineering notes | **Claims checkout is disabled and prices are TODO tokens. Both false.** | No | [EXECUTED] | Correct §Status/§Setup |
| **Refund/dispute webhooks** | ⚪ | — | Not built | No | [CODE-VERIFIED] | After entitlements |
| **Protected document reader** | ⚪ | — | Not built, not claimed | No | — | Future phase |
| **Watermarking** | ⚪ | — | Not built, not claimed | No | [EXECUTED] | Future phase |
| **Admin panel** | ⚪ | — | Not built, not claimed | No | [EXECUTED] | Future phase |

---

# PART 4 — LAUNCH BLOCKERS

## MUST FIX BEFORE FIRST CUSTOMER

Ranked by severity — money and access first.

| # | Blocker | Why it is a blocker | Evidence |
|---|---|---|---|
| **B-3** | **No study materials exist** | Customer pays $29–$179 and there is nothing to send them. Everything else is downstream of this. | `app/api/webhook` §1.5 [EXECUTED] |
| **B-2** | **A paid order reaches no human** | No email, no notification, no order list. Bryana cannot fulfil manually because she is never told a sale happened. | `app/api/webhook/route.ts:61-67` [EXECUTED] |
| **C-3** | **"All sales final" + undeliverable product** | The exact fact pattern that produces chargebacks. Chargebacks at volume freeze Stripe accounts. | `app/refunds/page.tsx:10-14` [CODE-VERIFIED] |
| **C-1** | **`[[TODO_DELIVERY_NOTE]]` on the post-payment page** | The customer's first impression after paying is a broken template variable. Plus 5 fully-placeholder pages and 6 tokens on `/about`. | Rendered HTML [EXECUTED] |
| **C-2** | **Privacy page is a placeholder** | Collecting emails and taking payments behind `[[TODO_PRIVACY]]`. Also fails to disclose Supabase storage and localStorage. | `app/privacy/page.tsx:10` [EXECUTED] |
| **F-2** | **Unmoderated testimonials publish instantly under a claim of moderation** | Anyone can put 1,200 characters of arbitrary text on Bryana's site. The page says every note is reviewed. It is not. | `app/testimonials/page.tsx:33, :81` [EXECUTED] |
| **F-1** | **Contact messages arrive in a table nobody reads** | Customers with purchase problems get a success message and silence. The page promises an "inbox" that does not exist. | `lib/supabase/contact-client.ts:17` [CODE-VERIFIED] |
| **A-1** | **Password reset cannot be completed** | The email sends; no route in the app can consume the link. Locked-out paying customers. | `next build` route list [EXECUTED] |
| **B-1** | **No entitlement system** | Customers A, B and C receive identical libraries. Access is "is logged in." | `app/member/page.tsx:134` [EXECUTED] |
| **D-1** | **Unrate-limited browser writes to Supabase with the publishable key** | Anyone can extract the key and insert rows directly, exhausting the project quota. | `contact-client.ts:17-32` [CODE-VERIFIED] |

**Note on B-1:** if the launch model is genuinely manual fulfilment — which the
project documentation states — then B-1 can be *deferred* provided the member
login and member dashboard are **removed or clearly labelled "coming soon"**
before launch. What cannot ship is a member area that implies automated access
while delivering none. B-2 cannot be deferred under any model.

## SHOULD FIX BEFORE LAUNCH

| # | Item | Evidence |
|---|---|---|
| SEC-1 | No security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) | [EXECUTED] |
| A11Y-1 | Focus ring 1.09:1 and focus border 2.97:1 — both below WCAG 3:1, on the sign-in form | [EXECUTED] |
| A11Y-2 | Cart panel has no `role="dialog"`, no focus management, and does not close on Escape | [EXECUTED] |
| R-5 | Hardcoded Supabase fallbacks let a misconfigured deploy silently write to production | [CODE-VERIFIED] |
| S-1 | `/thanks` ignores `session_id`; cannot show the buyer what they bought | [EXECUTED] |
| DOC-1 | `README.md:58-59, :89-90` claims checkout is disabled and prices are TODO tokens — both false | [EXECUTED] |
| R-1 | No `main` branch; production deploys from a feature branch; orphan branch would delete features | [EXECUTED] |
| SEO-1 | All 9 product pages share one title/description | [EXECUTED] |
| — | No sitemap, no canonical URLs, no OG image | [EXECUTED] |
| — | No skip-to-content link | [EXECUTED] |

## SAFE TO DO AFTER LAUNCH

- `charge.refunded` / `dispute` / `payment_failed` webhook handling *(needed only once entitlements exist)*
- Stripe Tax configuration *(decide with an accountant; open question flagged at `checkout/route.ts:8-13`)*
- Move sessions from `localStorage` to httpOnly cookies *(required before serving paid files, not before taking a payment)*
- Watermarking and signed-URL delivery *(future phase)*
- Testimonial approval admin UI *(interim: approve rows directly in Supabase)*
- Purchase-event analytics in Clarity
- Remove the unused `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from `.env.example`
- Patch-level dependency bumps

## Explicitly out of scope — resisting scope creep

The following are **not** recommended and should not be built for this launch: a
CMS, an admin dashboard, a protected in-browser document reader, DRM,
subscription billing, a customer-facing order-history page, multi-currency,
affiliate tracking, or a testimonial carousel. This is a small business taking
its first orders. Everything above is a distraction until B-3 is closed.

---

# PART 8 — STOP AND REPORT

## A. Readiness score: **43 / 100**

Weighted so that payment correctness and access control dominate polish.

| Category | Weight | Score | Points lost | Why |
|---|---:|---:|---:|---|
| **Payment correctness** | 25 | 18 | −7 | Server-derived pricing, validation, and signature verification are all correct and executed-verified. Lost for: no tax decision, no refund/dispute/failure event handling, no idempotency scaffold, and live/test mode unverifiable. |
| **Fulfillment & access control** | 25 | 2 | −23 | Nothing is persisted, nobody is notified, no entitlements exist, A/B/C get identical access, nothing to deliver. The 2 points are for correctly stamping entitlement metadata into Stripe, which genuinely preserves every order. |
| **Security & data protection** | 15 | 9 | −6 | No secret leakage anywhere, no service-role misuse, no client-trusted pricing, correct webhook verification. Lost for: unrate-limited browser writes to Supabase, missing moderation filter, no security headers, client-only route gating, RLS unverifiable. |
| **Legal, trust & claim accuracy** | 15 | 5 | −10 | Terms and Refunds are genuinely well drafted. Lost for: placeholder privacy policy, a false moderation claim on a live page, a non-existent "contact inbox" promised in copy, final-sale terms on an undeliverable product, and a README that misstates live risk. |
| **Content readiness** | 10 | 1 | −9 | No study materials at all; 5 fully-placeholder pages; 6 tokens on About; placeholder on the post-payment page. |
| **Accessibility** | 5 | 3 | −2 | Labels, tab order, reduced motion and touch targets are all good. Lost for: sub-3:1 focus indicators and a cart panel that is not a dialog. |
| **Storefront & responsive quality** | 5 | 5 | −0 | Zero overflow at five widths, zero JS errors, purchase flow completable on a 375px phone. Nothing to fix. |
| **Total** | **100** | **43** | **−57** | |

**What the score means.** This is not a 43-out-of-100 codebase. The engineering
that exists is careful, well-commented, and in several places better than most
sites at this stage — the pricing authority, the webhook verification, the
responsive work, and the secret hygiene are all genuinely production-grade. The
score is low because **the audit's test is whether a stranger can pay tonight and
correctly receive what they bought**, and against that test the system scores
near zero on the half that matters most.

Roughly: **a finished storefront in front of an unfinished business.**

## B. Launch blockers, ranked

1. **B-3** — No study materials exist *(everything else is downstream)*
2. **B-2** — A paid order reaches no human
3. **C-3** — "All sales final" attached to an undeliverable product
4. **C-1** — `[[TODO_DELIVERY_NOTE]]` on the post-payment page + 5 placeholder pages
5. **C-2** — Privacy page is a placeholder
6. **F-2** — Unmoderated testimonials publish instantly under a false moderation claim
7. **F-1** — Contact messages arrive nowhere a human will look
8. **A-1** — Password reset cannot be completed
9. **B-1** — No entitlement system *(deferrable only if the member area is removed)*
10. **D-1** — Unrate-limited public writes to Supabase

## C. Estimated work remaining

Engineering hours only. **Content authoring by Bryana is excluded and is the
largest single item on the critical path.**

| # | Task | Hours | Confidence |
|---|---|---:|---|
| 1 | Order-notification email on `checkout.session.completed` (Resend; buyer + Bryana) | 3–5 | **High** — pattern already exists in `api/testimonials/route.ts` |
| 2 | Rewrite `/thanks`: real copy, read `session_id`, show what was bought | 2–3 | **High** |
| 3 | Delete `/blog` `/updates` `/resources` `/study-guides` `/mock-exams`; clear About tokens | 1–2 | **High** — deletion + Bryana's figures |
| 4 | Privacy policy: write, disclose Supabase + localStorage | 2–3 | **Medium** — needs attorney review |
| 5 | Reconcile refund policy with the real delivery process | 1–2 | **Medium** — business decision |
| 6 | Testimonials: status filter on both queries + approval process | 3–5 | **Medium** — depends on live schema I could not read |
| 7 | Contact form → server route + email delivery + rate limit | 3–4 | **High** |
| 8 | `/reset-password` route + Supabase redirect config | 3–4 | **Medium** — needs Supabase dashboard access |
| 9 | Remove/relabel the member area *(if launching manual-fulfilment)* | 1–2 | **High** |
| 10 | Security headers | 1 | **High** |
| 11 | Focus-ring contrast + cart dialog semantics + skip link | 2–3 | **High** |
| 12 | Remove hardcoded Supabase fallbacks; fail loudly | 1 | **High** |
| 13 | Sitemap, canonicals, OG image, per-domain metadata | 2–3 | **High** |
| 14 | Correct `README.md`; establish `main`; document deploy flow | 2–3 | **Medium** — branch work needs approval |
| 15 | Stripe verification pass: test purchase, webhook delivery, receipts, live keys | 2–4 | **Low** — I have no dashboard visibility; could uncover more |
| | **Subtotal — launch-blocking (1–9)** | **19–30** | |
| | **Subtotal — should-fix (10–15)** | **10–17** | |
| | **Total** | **29–47** | |

**Deferred to a later phase (not costed here):** entitlement persistence,
protected delivery, watermarking, refund/dispute webhooks, cookie-based sessions.
Realistically **25–40 further hours** once content exists and volume justifies it.

**Lowest-confidence estimates:** #15 (no dashboard access — could reveal that the
webhook was never registered, which would change the picture) and #6 (I could not
read the live testimonials schema).

## D. Recommended implementation order

**Phase 0 — Decide before writing any code.** Two business decisions gate
everything: *(a)* Is launch manual-fulfilment or automated? *(b)* Which domain
ships first? Nothing below should start until these are answered.

**Phase 1 — Stop the bleeding (do not launch without these).**
Order-notification email (#1) → rewrite `/thanks` (#2) → delete placeholder
pages (#3) → contact form to a real destination (#7) → testimonial moderation
filter (#6) → password reset (#8).
*Rationale: these are the paths where a real customer's money or message is
currently lost. #1 first because until Bryana learns a sale happened, no manual
fulfilment is possible at all.*

**Phase 2 — Legal and truth.** Privacy policy (#4) → refund policy reconciliation
(#5) → remove/relabel the member area (#9) → correct the README (#14).
*Rationale: every remaining false claim on the site gets fixed together, then
reviewed by an attorney in one pass.*

**Phase 3 — Harden.** Security headers (#10) → accessibility (#11) → remove
hardcoded fallbacks (#12) → SEO/launch-day list (#13).

**Phase 4 — Verify, then flip.** Stripe test purchase end to end (#15) → confirm
webhook delivery → switch to live keys → flip the three noindex layers → watch
the first real order all the way through by hand.

**Phase 5 — Only after real sales.** Entitlements, protected delivery,
watermarking, refund webhooks. Per `BACKEND_HANDOFF.md:74-84`, let demand pull
this into existence.

## E. Files I want to change

**No file in this repository has been modified by this audit.** `git status` is
clean; `git diff` is empty. Everything below awaits approval.

| File | One-line reason |
|---|---|
| `app/api/webhook/route.ts` | Send the order-notification email; add idempotency scaffolding before any future grant. |
| `app/thanks/page.tsx` | Replace `[[TODO_DELIVERY_NOTE]]` with real copy and read the `session_id` it is already handed. |
| `app/privacy/page.tsx` | Replace `[[TODO_PRIVACY]]`; disclose Supabase storage and `localStorage`. |
| `app/refunds/page.tsx` | Align the policy with the actual delivery process. |
| `app/about/page.tsx` | Replace 6 visible `[[TODO_]]` tokens with Bryana's real figures and copy. |
| `app/blog/page.tsx`, `app/updates/page.tsx`, `app/resources/page.tsx`, `app/study-guides/page.tsx`, `app/mock-exams/page.tsx` | **Delete** — five fully-placeholder public routes. |
| `app/testimonials/page.tsx` | Add the approved-status filter to the query at `:33`; the page claims moderation it does not perform. |
| `app/api/testimonials/route.ts` | Same filter at `:72`; add a rate limit. |
| `app/contact/page.tsx` | Post to a server route instead of writing to Supabase from the browser; correct the "inbox" copy. |
| `lib/supabase/contact-client.ts` | Replace with a server-side path; remove the hardcoded credential fallback. |
| `lib/supabase/auth-client.ts` | Remove the hardcoded URL/key fallback; fail loudly when env vars are absent. |
| `app/reset-password/page.tsx` | **New** — complete the password-reset flow that currently dead-ends. |
| `app/api/contact/route.ts` | **New** — server-side contact handling with validation, honeypot and rate limit. |
| `next.config.ts` | Add baseline security headers; remove the noindex block on launch day. |
| `app/layout.tsx` | Remove the `robots` block on launch day; add an OG image. |
| `app/robots.ts` | Flip `disallow` to allow on launch day. |
| `app/sitemap.ts` | **New** — no sitemap exists. |
| `app/domain/[slug]/page.tsx` | Add `generateMetadata`; nine product pages currently share one title. |
| `app/contact/contact.module.css`, `app/sign-in/sign-in.module.css`, `app/testimonials/testimonials.module.css` | Raise focus-ring alpha to clear WCAG 3:1. |
| `components/CartPanel.tsx` | Add `role="dialog"`, `aria-modal`, focus management, and Escape-to-close. |
| `app/member/page.tsx` | Remove or clearly label the member area if launching with manual fulfilment. |
| `README.md` | Correct the false claims that checkout is disabled and that prices are TODO tokens. |
| `.env.example` | Drop the unused `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. |

**Not touched without explicit approval, per the operating rules:** no database
migration, no RLS change, no auth rewrite, no checkout redesign, no branch
operation, no live-mode Stripe call.

---

## Stopping here

This is an audit. No implementation pass was performed and no source file was
modified. **Awaiting approval before any of Part 8-E is carried out.**
