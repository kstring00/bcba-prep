# Backend handoff — BCBA Prep member library

This branch establishes the backend/product contract for the next build pass. It is intentionally written so another coding agent can continue without rediscovering the product model.

## Product decision

BCBA Prep is **domain-first**, not file-first.

Customers do not buy a standalone “Mock Exams” product, a standalone “Study Guides” product, or a standalone “Resources” product. Those materials are included inside whatever BCBA domain(s) the customer owns.

Examples:

- Buy Domain B → unlock all current/future Domain B materials.
- Buy Domains B + C + E in a promotion → unlock B, C, and E.
- Buy the complete bundle → unlock all nine domains.

`lib/products.ts` therefore maps every sellable product to `entitlementSlugs`. Payment fulfillment should always derive access from that server-side mapping. Never accept entitlement/domain names from the browser.

The top navigation has also been simplified accordingly. `/resources`, `/mock-exams`, and `/study-guides` should not be primary storefront tabs.

## Member flow

Recommended customer journey:

1. Visitor browses the public bookshelf and domain sales pages.
2. Customer selects one or more domains / a bundle.
3. Before checkout, require sign-in or account creation with Supabase Auth.
4. The server creates a Stripe Checkout Session and attaches the verified Supabase user ID to the session metadata / `client_reference_id`.
5. Stripe completes payment.
6. The signed Stripe webhook looks up the paid line items by Stripe Price ID/product ID and derives domain grants from the server-side product catalog.
7. Webhook records the purchase and creates domain entitlement rows idempotently.
8. Customer lands in `/library` and sees only domains for which they have an active entitlement.
9. Opening a purchased domain renders the material inside the site; it does not expose a permanent public file URL.

## Supabase recommendation

Create a dedicated **BCBA Prep** Supabase project. Do not reuse an unrelated project.

Current Supabase guidance for Next.js App Router is cookie-based SSR using `@supabase/ssr`, with a browser client + request-scoped server client and a Next.js `proxy.ts` to refresh sessions. Protected server routes should validate identity with `auth.getClaims()` / `auth.getUser()` rather than trusting `getSession()` user data.

Environment contract is in `.env.example`.

### Tables

The starter SQL is in `supabase/schema.sql`.

Core concepts:

- `member_profiles` — minimal member-facing profile data.
- `purchases` — one row per Stripe Checkout Session.
- `purchase_items` — immutable record of the product IDs paid for.
- `entitlements` — the actual authorization source: which user owns which domain.
- `materials` — metadata for resources inside a domain.
- `testimonials` — public, publishable testimonials for the new carousel.

Do **not** make purchase authorization decisions from user-editable auth metadata.

## Material security / screenshot reality

A normal website cannot reliably stop an operating-system screenshot. Browser JavaScript cannot control Windows/macOS/iOS/Android screen-capture APIs the way a managed desktop app, virtual desktop, DRM video player, or enterprise policy can.

So the goal is **deterrence + traceability + no easy source-file extraction**, not a false promise that screenshots are impossible.

### Layered protection model

1. **Authentication**
   - Supabase Auth required for `/library` and every material endpoint.

2. **Authorization**
   - Every material request checks an active `entitlements` row for `auth.uid()` + that material's `domain_slug`.
   - RLS protects metadata tables.

3. **Private storage**
   - Use a private Supabase Storage bucket named `materials`.
   - Do not publish permanent Storage URLs.
   - Prefer not to give the browser direct Storage SELECT access at all.

4. **Server-mediated delivery**
   - Recommended route shape: `/api/materials/[materialId]/pages/[page]`.
   - Server validates the user's JWT and entitlement, then fetches from private storage using the server-only secret key.
   - Return `Cache-Control: private, no-store`.
   - Do not add a `Content-Disposition: attachment` download path.

5. **Prefer page assets over raw PDFs**
   - For high-value PDFs, convert each source PDF into page images/WebP assets at ingestion time.
   - Store those page assets privately by domain/material/page.
   - The browser never receives the original PDF file in one request.
   - This does not make extraction impossible, but it materially raises the effort required to duplicate an entire product.

6. **Personalized visible watermark**
   - Overlay a repeating, low-opacity watermark in the reader containing a member identifier such as masked email + short user ID.
   - Example: `k***@gmail.com · 8F21`.
   - Move/rotate watermark positions subtly by session/page so bulk cropping is annoying.
   - For strongest traceability, eventually bake the watermark server-side into the returned page image rather than relying only on removable DOM text.

7. **UI deterrents**
   - Disable ordinary text selection/context menu in the protected reader.
   - Hide protected content in `@media print`.
   - Intercept common print/save shortcuts as a deterrent only.
   - These are UX barriers, not security controls.

8. **Session/risk controls later**
   - Record material-view events if abuse becomes a problem.
   - Add rate limits for page fetches.
   - Flag extreme page scraping / simultaneous geographic sessions for review.

### Avoid

- Public Supabase buckets for paid material.
- Permanent signed URLs embedded into HTML.
- A raw `/downloads/domain-b.pdf` route.
- Authorization based only on “logged in = yes.”
- Authorization based on `user_metadata`.
- Claims that screenshots are impossible on the web.

## Stripe fulfillment contract

Checkout should eventually become **login-required**.

When creating the Stripe Checkout Session:

- Resolve products server-side from `lib/products.ts` as today.
- Resolve the logged-in Supabase user server-side.
- Set `client_reference_id` to the Supabase user ID.
- Also set `metadata.supabase_user_id` to that same verified ID for clarity.
- Optionally prefill `customer_email` from the verified account email.

On `checkout.session.completed`:

1. Verify the Stripe signature (already implemented).
2. Read the verified user ID from Stripe session metadata/reference.
3. Fetch line items from Stripe.
4. Map Stripe Price IDs back to the server-side `Product` records.
5. Insert `purchases` using `stripe_checkout_session_id` as a unique idempotency key.
6. Insert `purchase_items`.
7. For each product, insert its `entitlementSlugs` into `entitlements`.
8. Use unique constraints / upsert so Stripe retries cannot double-grant or corrupt data.

Refund handling can be a second pass. Do not automatically revoke an entitlement until the business rule for partial refunds versus bundled access is defined.

## Bundle/deal architecture

The current catalog has individual domain modules + a complete bundle. The model is intentionally compatible with future “pick your domains” deals.

Good future options:

- 1 domain = normal price
- pick any 3 = package discount
- pick any 5 = larger package discount
- all 9 = complete bundle

Do not encode this pricing until Bryana/Kyle decides the actual numbers. Access should still resolve to domain entitlements regardless of how the discount was priced.

## Member library UI contract

Suggested routes:

- `/sign-in` — public auth gateway.
- `/library` — authenticated bookshelf/dashboard showing owned + locked domains.
- `/library/[slug]` — protected domain home.
- `/library/[slug]/[material]` — protected reader/quiz/mock experience.

A locked domain can still visually appear on the shelf as an upsell, but its protected material endpoints must remain server-authorized.

## Testimonials carousel

Bryana wants a beautiful testimonial carousel. The backend table is included now so the visual layer does not need testimonials hard-coded forever.

Suggested fields:

- testimonial quote
- name
- credential/status (example: `BCBA Candidate`, only if supplied/verified)
- optional rating
- sort order
- featured flag
- published flag

Visual direction for the next frontend pass:

- Editorial/luxury card rather than a generic SaaS slider.
- Cream paper cards, fine gold rules, mauve/violet botanical accents consistent with the site.
- One strong quote centered, adjacent cards partially visible on desktop.
- Slow auto-advance, draggable/swipeable, dots or a thin progress rail.
- Pause on hover/focus and respect reduced-motion settings.
- Never invent testimonial copy or names.

## Files changed on this branch

- `components/SiteHeader.tsx` — removed Resources, Mock Exams, and Study Guides from primary navigation.
- `lib/products.ts` — products now explicitly grant domain entitlement slugs.
- `.env.example` — documented Supabase public + server-only variables.
- `README.md` — records the new domain-first product model.
- `supabase/schema.sql` — database/RLS/storage foundation.
- `BACKEND_HANDOFF.md` — this implementation contract.

## Next coding pass

Recommended order when continuing:

1. Create/connect dedicated BCBA Prep Supabase project.
2. Install pinned `@supabase/supabase-js` and `@supabase/ssr` versions and commit the lockfile.
3. Apply/review `supabase/schema.sql` as a real migration, then run Supabase security/performance advisors.
4. Add `lib/supabase/client.ts`, `server.ts`, admin-only client, and session `proxy.ts` following current Supabase docs.
5. Replace the placeholder sign-in page with real Supabase auth.
6. Make checkout login-required and attach verified user identity.
7. Finish webhook fulfillment → purchases + entitlements.
8. Build `/library` with protected domain access.
9. Build the page-based protected reader + watermark layer.
10. Build the testimonial carousel against `testimonials`.

Do not disturb the existing 3D book geometry/motion system while doing the backend pass unless necessary; the README documents several load-bearing implementation details.
