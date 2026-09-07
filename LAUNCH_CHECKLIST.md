# Launch Checklist — BCBA Prep

**Current state: PRE-LAUNCH HARDENED. The store is closed and cannot take a payment.**

This document is the single source of truth for what remains between today and
the first real customer. It exists because the hardening work deliberately
stopped short of commerce: Bryana is finishing her own BCBA certification
before releasing any study materials, so there is nothing to deliver and
therefore nothing to sell.

---

## WHEN BRYANA PASSES — the short version

Nine steps, in order. Do not reorder them; each one depends on the one above.

| # | Step | Who | Rough effort |
|---|---|---|---|
| 1 | **Finish and upload the study materials.** Nothing below matters until the product exists. | Bryana | Her timeline |
| 2 | **Decide how a buyer receives them** — email by hand, or automated delivery. This decision drives steps 3–5. | Bryana + Kyle | 1 conversation |
| 3 | **Build fulfilment to match that decision.** Manual = an order-notification email. Automated = purchases, entitlements and protected delivery. | Kyle | 4h manual / 25–40h automated |
| 4 | **Fill in the domain contents** on each of the nine product pages, so buyers can see what they are paying for. | Bryana + Kyle | 2–4h |
| 5 | **Reconcile the refund policy** with the real delivery process. | Bryana + attorney | 1–2h |
| 6 | **Attorney review** of Terms, Refunds and Privacy. | Attorney | External |
| 7 | **Stripe live verification** — account in Bryana's name, live keys, webhook registered and delivering, one real test purchase, then refund it. | Kyle + Bryana | 2–4h |
| 8 | **Open the gate**: set `NEXT_PUBLIC_SALES_ENABLED=true` in Vercel and redeploy. | Kyle | 5 min |
| 9 | **Turn on search indexing** — three files, all together (§4 below). | Kyle | 15 min |

**Do not do step 8 before step 7.** Opening the gate is the moment real money
becomes possible.

---

## 1. What is already done

These were completed during the pre-launch hardening pass and need no further
work. Each was verified by running it, not by reading the code.

| Area | State |
|---|---|
| **Payment safety** | Store gated closed at `lib/launch.ts`. `/api/checkout` returns 503 before any Stripe call. A hand-written POST is refused. |
| **Storefront** | Prices, buy buttons and the cart are hidden while the gate is closed. A calm "not yet available" notice appears instead. |
| **Placeholders** | Zero `[[TODO_]]` tokens anywhere in source or in rendered HTML. Five placeholder routes deleted. |
| **Contact form** | Posts to `/api/contact`, validated server-side, honeypot, two-tier rate limit, delivered by email. **Refuses** rather than faking success when email is unconfigured. |
| **Testimonials** | Both read queries filter `status=eq.approved`, so the on-page promise of review is now true. |
| **Password reset** | `/reset-password` completes the flow. Handles valid, expired, wrong-type and missing tokens. Scrubs the token from the address bar. |
| **Privacy policy** | Written. Describes the real data flows, including Supabase, Resend, Vercel and browser storage. |
| **Terms & Refunds** | Carry a visible pre-launch notice that nothing is on sale. The notice disappears automatically when the gate opens. |
| **Accessibility** | Focus indicator raised from 1.09:1 to **6.08:1**. Skip link added. Cart panel is now a real dialog: `role="dialog"`, focus moves in, focus is trapped, Escape closes it. |
| **Security headers** | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`. |
| **Config safety** | No hardcoded Supabase or Clarity fallbacks. Missing variables fail loudly instead of silently connecting to a specific project. |
| **Documentation** | `README.md` corrected. Four handoff documents current. |

## 2. What is deliberately deferred

Not oversights. Each is deferred because it depends on materials that do not
exist yet, and building it now would mean guessing at requirements.

| Deferred | Why | Unblocked by |
|---|---|---|
| Purchase → entitlement automation | Nothing to grant access *to* | Step 1 |
| Private study-material storage | No files to store | Step 1 |
| Domain-access mapping | Depends on how materials are organised | Steps 1–2 |
| Production fulfilment | Depends on the manual/automated decision | Step 2 |
| Refund / dispute webhook handling | Only matters once access can be revoked | Step 3 |
| Cookie-based sessions | Only needed to check entitlements server-side | Step 3 |
| Live Stripe verification | Requires the live account and a real card | Step 7 |
| Real-customer purchase QA | Requires everything above | Step 7 |
| Content-Security-Policy | Needs the final list of third-party origins | Step 9 |

## 3. The intended entitlement architecture

Documented, not built. This is the design to follow when step 3 arrives, so the
decision is not re-litigated under time pressure.

**The join problem, first.** Checkout does not require an account, so the only
link between a payment and a person is `session.customer_details.email` — which
the buyer types at checkout and may not match their account email. There are two
honest options, and the choice must be made deliberately:

- **Require sign-in before checkout.** Simpler and exact; converts slightly
  worse. Recommended for a business this size.
- **Reconcile by email afterwards.** Converts better; needs a claim flow for
  mismatches and an admin fallback for the ones that never resolve.

**Then, in order:**

1. `purchases` table, unique on `stripe_checkout_session_id`.
2. Idempotency on `event.id` — checked **before** any grant is written. Stripe
   delivers the same event more than once; today's webhook has no dedupe
   because it grants nothing, so this must be added at the same time as the
   first grant.
3. `entitlements` rows derived from `metadata.entitlement_slugs`, which
   `/api/checkout` already writes from the server-side catalogue. **Never** from
   anything the browser sent.
4. Move sessions from `localStorage` to httpOnly cookies, so `/member` can check
   entitlements on the server rather than in the browser.
5. Serve files through a route that checks entitlement and issues a short-lived
   signed URL. Never expose a bucket path.
6. Add `charge.refunded` and `charge.dispute.created` handlers to revoke.

`supabase/schema.sql` is a reasonable starting point for the table shapes, but
**it is not the live schema** — it disagrees with the running `testimonials`
table and omits `contact_messages` entirely. Dump the live schema and compare
before any migration.

## 4. Turning on search indexing

Currently the site is hidden from search engines in three coordinated places.
**All three must be changed together**, or the site will be partially indexed
in an inconsistent state.

- [ ] `next.config.ts` — remove the `X-Robots-Tag` entry **only**. Leave the
      security headers above it in place.
- [ ] `app/layout.tsx` — remove the `robots` block from `metadata`.
- [ ] `app/robots.ts` — replace `disallow: "/"` with an allow rule.
- [ ] Verify: `curl -I https://<domain>/` shows **no** `X-Robots-Tag`.

Then the SEO work that was never done:

- [ ] Add `app/sitemap.ts`
- [ ] Add `generateMetadata` to `app/domain/[slug]/page.tsx` — all nine product
      pages currently share one title and description
- [ ] Add an Open Graph image (`twitter:card` is declared as
      `summary_large_image` with no image behind it)
- [ ] Add canonical URLs

## 5. Environment variables to set before launch

By name only. Values go in Vercel, never in git.

| Variable | Scope | Note |
|---|---|---|
| `NEXT_PUBLIC_SALES_ENABLED` | Production | **Set to `true` only at step 8** |
| `STRIPE_SECRET_KEY` | Production | The **live** key |
| `STRIPE_WEBHOOK_SECRET` | Production | From the **live** endpoint |
| `NEXT_PUBLIC_SUPABASE_URL` | All | |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | All | |
| `RESEND_API_KEY` | All | Contact form refuses submissions without it |
| `CONTACT_INBOX_EMAIL` | All | Where messages land |
| `CONTACT_FROM_EMAIL` | All | Must be a Resend-verified domain |
| `TESTIMONIAL_REVIEW_EMAIL` | Production | Optional; falls back to the inbox |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | Production only | Leave blank elsewhere |
| `NEXT_PUBLIC_SITE_URL` | Production | The real origin |

**Also set in the Supabase dashboard:** add `https://<domain>/reset-password`
under Authentication → URL Configuration → Redirect URLs, or password-reset
links will bounce to the site root and the flow will not complete.

**Also confirm in Supabase:** the `testimonials` table has a `status` column,
and the approved value is exactly the string `approved`. Both read queries
filter on it. If the column is named differently, change it in
`app/testimonials/page.tsx` and `app/api/testimonials/route.ts` **together**.

## 6. Still outstanding, unrelated to materials

Small items that do not block launch but should not be forgotten.

- [ ] Establish a `main` branch. Production currently deploys from
      `claude/bcba-bookshelf-nav-p63hnv` and there is no `main`.
- [ ] Decide what to do with `chatgpt/backend-foundation`. It is an orphan root
      with no common ancestor; merging it would delete the member area,
      sign-in, testimonials and the noindex protections. Tag it, then delete it.
- [ ] Decide sales tax. Stripe direct makes the seller the merchant of record.
- [ ] Confirm every account is in Bryana's name — see
      `CLIENT_OWNERSHIP_HANDOFF.md`. **Stripe before the first real payment.**
- [ ] Add a Content-Security-Policy once the third-party origins are final.
- [ ] Build a testimonial approval screen, or accept that approving means
      editing a row in Supabase and document it that way.

## 7. The day the gate opens

- [ ] Every box above is ticked
- [ ] `NEXT_PUBLIC_SALES_ENABLED=true` set in Vercel Production, redeployed
- [ ] Confirm a price and a buy button now appear on a domain page
- [ ] Confirm the pre-launch notices have disappeared from Terms and Refunds
- [ ] Place one real purchase with a real card
- [ ] Confirm the Stripe webhook shows **200** in Recent deliveries
- [ ] Fulfil that order end to end, timed, to validate the real process
- [ ] Refund it and confirm the money returns
- [ ] Watch Vercel logs and Stripe events through the first genuine customer

**Rolling back is one variable.** If anything looks wrong after opening,
set `NEXT_PUBLIC_SALES_ENABLED` back to `false` and redeploy. The store closes
immediately and no further payment can be taken.
