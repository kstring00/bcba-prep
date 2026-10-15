# Test Script — Member Routing, Fulfilment and Access Control

Run against a deployed preview with **Stripe in test mode**. Takes about 20
minutes.

---

## Before you start

**1. Apply the migration.** Supabase → SQL Editor → paste
`supabase/migrations/0001_entitlements.sql` → Run. It is idempotent, so
re-running is safe.

**2. Set these in Vercel** (names only — values from the dashboards):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SALES_ENABLED` | `true` |
| `ALLOW_LIVE_PAYMENTS` | leave unset or `false` |
| `STRIPE_SECRET_KEY` | the **test** key (`sk_test_…`) |
| `STRIPE_WEBHOOK_SECRET` | from the **test** webhook endpoint |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._PUBLISHABLE_KEY` | as already set |
| `NEXT_PUBLIC_SITE_URL` | the preview origin |

Redeploy after changing any of them — `NEXT_PUBLIC_*` values are baked in at
build time.

**3. Register the test webhook.** Stripe (test mode) → Developers → Webhooks →
add `https://<your-domain>/api/webhook`, event
`checkout.session.completed`. Also add `charge.refunded` and
`charge.dispute.created` if you want to exercise revocation.

**4. Add the Supabase redirect URL.** Authentication → URL Configuration →
Redirect URLs → add `https://<your-domain>/reset-password`. Password reset
cannot complete without it.

**5. Seed one piece of content** so there is something to open. SQL Editor:

```sql
insert into public.content_items (sku, kind, title, description, storage_path, is_published)
values ('domain:principles', 'file', 'Domain B Study Guide',
        'Concepts and principles.', 'principles/guide.pdf', true);
```

Then upload any PDF to the private `materials` bucket at exactly
`principles/guide.pdf` (Storage → materials → Upload).

---

## A. Logged out: browse → sign up → buy Domain B

| # | Do this | Expect |
|---|---|---|
| A1 | Open the homepage signed out | Nine books. No "Owned" badges. Header shows **Member Login** (exactly one, at any width) |
| A2 | Click Domain B | Sales page with a price and **Add domain license** |
| A3 | Add it, open the cart, click **Purchase licenses** | Refused with *"Please sign in before checking out…"* |
| A4 | Go to **Member Login** → **Create account** → a real address you can read | Either lands in My Library, or asks you to confirm your email |
| A5 | If asked: open the confirmation email, click through, then sign in | Signed in |
| A6 | Header now | **My Library** + account chevron. **No** "Member Login" anywhere |
| A7 | Back to Domain B → add to cart → **Purchase licenses** | Stripe Checkout opens |
| A8 | Pay with `4242 4242 4242 4242`, any future expiry, any CVC | Payment succeeds |

## B. Land in My Library with Domain B unlocked

| # | Do this | Expect |
|---|---|---|
| B1 | After paying | Redirected to **My Library**, not left on a thank-you page |
| B2 | The page | Green banner *"your purchase is unlocked"*; Domain B card ringed with a **New** flag |
| B3 | Domain B card | Lists **Domain B Study Guide** with a Download action |
| B4 | Click Download | The PDF opens or downloads |
| B5 | Stripe → Developers → Webhooks → your endpoint | `checkout.session.completed` delivered **200** |
| B6 | Supabase → Table Editor → `entitlements` | One row: your user_id, `domain:principles`, `active = true` |
| B7 | `purchases` | One row, status `paid`, session id matching Stripe |

## C. Home → Domain B opens content, not the sales page

| # | Do this | Expect |
|---|---|---|
| C1 | Go to the homepage | Domain B now carries a **✓ Owned** badge |
| C2 | Click Domain B | Goes to `/member/domain/principles` — the **content**, not the sales page |
| C3 | The page | Title, and the study guide ready to download |
| C4 | Open `/domain/principles` directly | Shows **✓ Owned** and an **Open** button. **No buy button, no price** |

## D. Domain C still shows Unlock

| # | Do this | Expect |
|---|---|---|
| D1 | Homepage → Domain C | **No** Owned badge |
| D2 | Click it | Sales page, with a price and **Add domain license** |
| D3 | My Library | Domain C under *"Not in your library yet"* with **Unlock** |
| D4 | Open `/member/domain/measurement` directly | Redirected to the Domain C **sales** page |

## E. Logged out, direct content URL → denied

The important one.

| # | Do this | Expect |
|---|---|---|
| E1 | Signed in, My Library → right-click the Download link → copy address | A `/api/content/<uuid>` URL |
| E2 | Sign out (account menu → Sign out) | Back on the homepage, signed out |
| E3 | Paste that URL | **401** — *"Please sign in to open your study materials."* No file |
| E4 | Open a private window and paste it | Same 401 |
| E5 | Create a **second** account, sign in as them, paste it | **403** — *"You do not have access to this item."* No file |
| E6 | As that second user, open `/member/domain/principles` | Redirected to the sales page |
| E7 | Try the Supabase storage URL directly: `https://<project>.supabase.co/storage/v1/object/public/materials/principles/guide.pdf` | **400 / not found** — the bucket is private |

## F. Nobody pays twice

| # | Do this | Expect |
|---|---|---|
| F1 | As the Domain B owner, try to add Domain B to the cart | Nothing added; cart shows *"You already own…"* |
| F2 | Open the cart with only Domain B and try to check out | **409** *"You already own everything in your cart."* |
| F3 | Add the complete bundle instead | **Allowed** — it includes eight domains you do not own |

## G. Webhook idempotency

| # | Do this | Expect |
|---|---|---|
| G1 | Stripe → Webhooks → your endpoint → the `checkout.session.completed` delivery → **Resend** | **200** |
| G2 | Resend twice more | **200** each time |
| G3 | Supabase → `entitlements` | Still exactly **one** row for that sku |
| G4 | `purchases` | Still exactly **one** row |
| G5 | `webhook_events` | One row for that event id |

## H. Forgot password, end to end

| # | Do this | Expect |
|---|---|---|
| H1 | Sign out → Member Login → type your email → **Forgot password?** | *"If that email has an account, a reset link is on its way."* |
| H2 | Open the email, click the link | Lands on `/reset-password` with two password fields |
| H3 | Check the address bar | **No** `access_token` in it — scrubbed on arrival |
| H4 | Enter a new password twice → Save | *"Your password is updated"* |
| H5 | Sign in with the **new** password | Works |
| H6 | Sign in with the **old** password | Rejected |
| H7 | Click the same reset link again | *"This link cannot be used"* |

## I. RLS, checked directly

Supabase → SQL Editor. First as the service role (default), then switch the
role selector to `authenticated` with your user.

| # | Query | Expect |
|---|---|---|
| I1 | `select * from public.entitlements;` as **user A** | Only user A's rows |
| I2 | `select * from public.purchases;` as **user A** | Only user A's rows |
| I3 | `select * from public.webhook_events;` as **user A** | Zero rows or permission denied |
| I4 | `select * from public.content_items;` as **user A** | Only rows for skus A owns |
| I5 | `insert into public.entitlements (user_id, sku) values (auth.uid(), 'domain:ethics');` as **user A** | **Denied** — there is no insert policy |

I5 is the one that matters: if it succeeds, a customer can grant themselves
the whole library.

## J. Every nav link, both states

Click each, signed out and signed in: Home · Mock Exams · About ·
Testimonials · Contact · the account control · Terms · Privacy · Refunds ·
footer Contact. None should 404, and none should show a different account
state than the header.

## K. Mobile, 375px

| # | Check |
|---|---|
| K1 | No horizontal scrolling on any page |
| K2 | The hamburger opens and contains **My Library** and **Sign out** when signed in |
| K3 | Add to cart → open cart → checkout button reachable |
| K4 | My Library readable; Download rows tappable |
| K5 | About: photo, credential strip and sign-off all stack cleanly |

## L. Refund revokes access *(optional)*

| # | Do this | Expect |
|---|---|---|
| L1 | Stripe → the test payment → Refund | Refunded |
| L2 | `purchases` row | status `refunded` |
| L3 | `entitlements` row | `active = false`, `revoked_at` set |
| L4 | Reload My Library | Domain B back under *"Not in your library yet"* |
| L5 | Paste the old content URL | **403** |

---

## If something fails

- **Paid but nothing in My Library** → Stripe → Webhooks → check the delivery.
  A 500 usually means `SUPABASE_SERVICE_ROLE_KEY` is missing. Fix it, then
  **Resend** the event.
- **Download gives 503** → same key missing, or the file is not at the
  `storage_path` in `content_items`.
- **Reset link bounces to the homepage** → the Supabase redirect URL is not
  registered (prep step 4).
- **Checkout returns 503** → either `NEXT_PUBLIC_SALES_ENABLED` is not `true`
  (and you redeployed), or a live key is present without `ALLOW_LIVE_PAYMENTS`.
