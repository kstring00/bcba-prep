# BCBA Prep architecture handoff — MVP first

> **Constraint rule:** finished sellable content and the first real sale come before member-platform infrastructure.
>
> This file records the intended destination architecture so the product does not paint itself into a corner. It is **not** a launch checklist. Do not provision Supabase, build the protected reader, or automate entitlements merely because designs for those systems exist here.

## What is true now

BCBA Prep is **domain-first**, not file-first.

Customers do not buy standalone “Mock Exams,” “Study Guides,” or “Resources” products. Those are contents of whichever BCBA domain the customer buys.

Examples:

- Buy Domain B → the purchase grants Domain B.
- Buy Domains B + C + E in a future promotion → the purchase grants B, C, and E.
- Buy the complete bundle → the purchase grants all nine domains.

`lib/products.ts` therefore maps every sellable product to `entitlementSlugs`.

That field is deliberately in production product code now because it is cheap to adopt and expensive to retrofit. For the MVP, it can simply tell the owner what the customer purchased for manual fulfillment. A future member system can persist the exact same grants.

Never accept entitlement/domain names from the browser. Derive them from the server-side product catalog.

The primary navigation is also domain-first. `/resources`, `/mock-exams`, and `/study-guides` are not primary storefront tabs.

## Current launch objective

Ship the smallest **genuinely valuable, complete domain product** Bryana can finish and accept real payment for it.

The platform can be minimal. The paid content should still feel excellent.

Recommended launch flow:

1. Visitor browses the public bookshelf/domain sales experience.
2. Customer buys a finished domain through Stripe Checkout.
3. Payment is verified through Stripe.
4. Bryana manually fulfills the purchased domain using the verified order/customer email.
5. Record customer feedback and whether buyers actually use/want the material.

Manual fulfillment is acceptable while sales volume is small. Automate it only when fulfillment itself becomes a meaningful bottleneck.

## What to build now

### Merge / keep in running code

- Domain-first navigation.
- `Product.entitlementSlugs` in `lib/products.ts`.
- Stripe server-side pricing/catalog authority.
- Existing signed Stripe webhook verification.
- Excellent sales pages for the first finished domain(s).

### Keep as architecture documentation only

- `supabase/schema.sql`.
- Future Supabase Auth + RLS model.
- Future purchase/entitlement records.
- Future private material storage.

### Explicitly postpone

- Supabase project provisioning.
- Login-required checkout.
- Automated Stripe → Supabase entitlement fulfillment.
- `/library` member portal.
- Protected document reader.
- Server-baked watermarks.
- Testimonials CMS.
- Testimonials carousel until there are at least three real, permissioned testimonials to design around.
- Complex “pick 3 / pick 5” pricing until actual pricing is decided and demand exists.

## Decision gate for Phase 2

Do not build the member platform because it sounds polished. Build it when evidence says it removes the current constraint.

Signals that justify moving to automated membership include things like:

- enough paid orders that manual delivery is becoming repetitive/error-prone;
- customers repeatedly asking for one place to access purchases;
- multiple domains are selling and customers commonly own more than one;
- credential sharing or piracy is demonstrated rather than hypothetical;
- support volume around lost links/files becomes material.

No single numerical threshold is sacred. The point is that revenue/use should pull the infrastructure into existence.

## Future Phase 2 — member platform

When automation becomes justified, the intended flow is:

1. Customer authenticates with Supabase Auth before checkout.
2. Server verifies the Supabase identity.
3. Stripe Checkout Session receives that verified user ID in `client_reference_id` / metadata.
4. Stripe completes payment.
5. Signed webhook fetches the paid line items.
6. Server maps those paid products to `entitlementSlugs` from `lib/products.ts`.
7. Purchase + entitlement rows are created idempotently.
8. Customer sees owned domains in `/library`.

Do not grant access because the browser returns to a success URL. Access must come from a verified Stripe event.

## Future Supabase model

A proposed schema is preserved in `supabase/schema.sql` for later review. It is intentionally **not applied to any project**.

When Phase 2 begins, create a dedicated BCBA Prep Supabase project rather than reusing an unrelated database.

The intended concepts are:

- `member_profiles` — minimal user-facing profile data.
- `purchases` — verified Stripe purchases.
- `purchase_items` — what was actually paid for.
- `entitlements` — which domains the user may access.
- `materials` — metadata for materials within each domain.
- `testimonials` — optional future publishing model, only if a CMS is actually useful.

### Authorization rule that must survive every future implementation

**Never use Supabase `user_metadata` / `raw_user_meta_data` for authorization.** It is user-editable.

Ownership/access must come from trusted database rows, server-derived product mappings, or trusted app metadata where appropriate. Every exposed user-data table must use proper Row Level Security; `TO authenticated` alone is authentication, not object-level authorization.

When Supabase is actually integrated, follow current Supabase SSR guidance rather than copying stale auth examples.

Future environment variables will be approximately:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
```

The secret key is server-only and must never be prefixed with `NEXT_PUBLIC_`.

## Future content protection — use evidence, not theater

A normal website cannot reliably disable operating-system screenshots. Do not promise that it can.

Also do **not** spend launch effort on right-click blocking, Cmd/Ctrl+S interception, Cmd/Ctrl+P interception, or aggressive copy prevention. Those controls are easy to bypass, annoy legitimate customers, and are not meaningful security boundaries.

If paid-content leakage becomes a real problem, prioritize controls in this order:

1. verified authentication;
2. domain entitlement authorization;
3. private source storage / no public source-file URLs;
4. account-linked visible watermarking;
5. session/device/concurrent-login abuse controls;
6. usage/rate monitoring;
7. server-baked personalized rendering only if the value/piracy problem justifies its cost.

The more likely early leak is shared credentials, not sophisticated screenshot extraction. Concurrent-session/account-sharing controls are therefore more valuable than fake screenshot prevention.

Server-baked watermarks remain a strong eventual option, but they require a rendering/caching/cost-control pipeline and are deliberately postponed until there is evidence they are needed.

## Future bundle/deal architecture

The entitlement model supports future pricing without changing authorization.

Possible later offers:

- 1 domain = standard price
- choose several domains = discount
- complete A–I bundle = strongest package price

The pricing engine can change. The result remains a set of domain entitlements.

Do not implement pricing tiers until Bryana/Kyle sets real prices.

## Testimonials

Do not build around placeholder social proof.

Wait until Bryana has at least three real testimonials with explicit permission to publish the quote/name/credential being shown. Then design the carousel around the actual content lengths and assets.

Never invent quotes, names, credentials, pass rates, ratings, or statistics.

## Theory of Constraints check

Before adding a new system, ask:

> What currently prevents more finished product from reaching a paying customer?

If the answer is “Bryana still needs to finish the domain,” more backend infrastructure does not move throughput.

If the answer later becomes “we are manually delivering dozens of purchases and customers need persistent access,” then the member system is justified.

## Next development order

1. Finish one genuinely valuable domain package.
2. Decide its product copy and price.
3. Configure the real Stripe Price ID.
4. Make checkout + payment verification reliable.
5. Fulfill early paid orders manually.
6. Observe sales, support load, repeat/multi-domain demand, and abuse.
7. Build the next bottleneck — not the most interesting future feature.

Do not disturb the existing 3D book geometry/motion system while making these changes unless necessary; the README documents several load-bearing implementation details.
