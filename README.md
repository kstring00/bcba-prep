# BCBA Prep by Bryana Utley

Study-materials store for BCBA exam candidates. Cream ground, watercolour
florals, gold hairlines, mauve accents. Nine content domains are a vertical
pile of bound volumes; clicking one folds it open into a detail view with
contents and price. Items go into an in-memory cart and check out through
Stripe.

Next.js App Router · TypeScript · Motion · Stripe · CSS 3D transforms and
inline SVG only (no WebGL, no Three.js, no 3D assets, no image sequences,
no image files at all).

## Where the design lives

- `app/globals.css` — every colour is a token in the `:root` block at the
  top. The whole palette moves from there.
- `components/Florals.tsx` — the watercolour flowers, built from layered
  petal paths: a blurred bleed underlay, a translucent radial wash, and a
  gold hairline. Three layers per petal is what separates this from a flat
  vector flower. Clusters are masked in CSS so their SVG bounding box does
  not read as a rectangle of tint.
- `components/Icons.tsx`, `components/Motifs.tsx` — all line art, inline.

## Product model

The store is **domain-first**.

Mock exams, study guides, quizzes, charts, flashcards, and other resources are
contents of a domain — not separate storefront categories. A customer buys a
domain (or later a multi-domain bundle), and that product's
`entitlementSlugs` describe the domain access it is intended to grant.

That entitlement mapping is kept in `lib/products.ts` now because it is cheap
to adopt and expensive to retrofit. It does **not** mean the member platform
must be built before launch.

## MVP constraint

The immediate goal is a finished, genuinely valuable domain product that can
take a real Stripe payment.

Early fulfillment may be manual. That is intentional. The current bottleneck
is finished sellable content and first-sale validation, not authentication,
a member portal, DRM, or entitlement persistence.

The proposed Supabase member-library architecture is preserved in
`supabase/schema.sql` and `BACKEND_HANDOFF.md` for a future phase. It should
only become running infrastructure when paid demand makes automated access the
actual constraint.

Do not build fake screenshot prevention. If content protection becomes a real
business problem later, prioritize authentication, entitlement checks, private
source storage, account-linked watermarks, and session/account-sharing controls.

## Status

**PRE-LAUNCH. The store is closed and cannot take a payment.**

Bryana is finishing her own BCBA certification before releasing any study
materials. Until then there is nothing to deliver, so selling is gated off at
`lib/launch.ts`:

- `NEXT_PUBLIC_SALES_ENABLED` must be exactly `"true"` to open the store.
  Anything else keeps it closed. The gate fails safe by design.
- `app/api/checkout/route.ts` returns **503** before touching Stripe. This is
  the authoritative layer — a hand-written POST hits it too.
- The storefront hides prices, buy buttons and the cart entirely. That part is
  courtesy, not security.

Prices are real and correct (`$29 / $75 / $115 / $179`, resolved in
`lib/products.ts`). They are simply unreachable while the gate is closed.

There are **no `[[TODO_]]` placeholder tokens left in the codebase.** A sweep
should return nothing:

```sh
grep -rn '\[\[TODO_' --include='*.ts' --include='*.tsx' app components lib
```

What is still missing before launch is tracked in `LAUNCH_CHECKLIST.md`. The
short version: the study materials themselves, a way to deliver them, and a
purchase-to-account link. Everything else is done.

Real content that ships today:

- **`lib/domains.ts`** — the nine domain titles, short labels, question counts
  and percentages, supplied by the project owner as verified against the BACB
  Test Content Outline. Counts sum to 175, percentages to 100.
- **Section copy on the About page** — transcribed from the reference design
  the owner supplied.

The About page deliberately carries no checkable claim. An earlier version
reserved space for four statistics, a personal story, a portrait and a studio
photograph; those placeholders rendered literally to visitors, so the blocks
were removed rather than invented. Bryana supplies the real figures and copy
before they come back.

Do not build the testimonial carousel around placeholders. Wait for at least
three real testimonials with permission to publish the displayed quote/name.

## Setup

```sh
npm install
cp .env.example .env.local   # then fill in the values you need
npm run dev
```

Nothing in `.env.local` is required just to browse the site. Supabase values
are needed for sign-in and testimonials; Resend values for the contact form;
Stripe values only once the sales gate is opened. Each feature fails loudly and
independently when its variables are missing — there are no silent fallbacks.

## Things that will bite you

**The 3D geometry.** The rotation signs in `app/globals.css` are load-bearing
and the failure mode is invisible in code — mirrored spine text, or a cover
hanging in front of its own spine. The derivation is at the top of that file.
The book tilt is past `-90deg` on purpose: that is what puts the viewer above
the pile so each book's lit top board shows. Also:

- A `filter` on `.book` flattens its 3D rendering context and collapses the
  spine to an invisible edge. Brightness shifts go on a leaf face.
- `overflow: hidden` is safe on a leaf face, never on a `preserve-3d`
  ancestor.
- The per-book horizontal jog must be subtracted from the book's width as
  well as added to its margin. `body { overflow-x: hidden }` hides the bleed
  from a scroll-width check while leaving it plainly visible on a phone.

**`arc()` only works through the imperative API.** In Motion 13.1.1,
`transition.path` is honoured by `animate()` and `useAnimate()`, and silently
ignored by a motion component's `transition` prop — the element snaps to its
target with no error and no completion callback. `components/AddToCart.tsx`
explains this at the call site. x and y must also travel in one call.

**The cart control is the flight target.** It lives in the sticky header,
which carries no 3D transform, so its `getBoundingClientRect` stays accurate.
Anything that targets "the cart" picks the control with a non-zero box, and
the impact registry broadcasts to a Set rather than a single slot — both
guard against a hidden duplicate stealing the landing or the knock.

**The header must fit a 380px phone.** The Member Login pill moves into the
menu below 1100px. Left in the bar it pushed the layout to 443px on a 380px
screen, which the browser papers over by zooming the whole page out rather
than by showing a scrollbar — so a `scrollWidth > innerWidth` check does not
catch it. Measure `window.innerWidth` against the device width instead.

**Prices are never taken from the client.** `app/api/checkout/route.ts`
receives product ids and quantities only, and resolves every line against
`lib/products.ts` server-side. The only fields ever read from the request body
are `items[].productId` and `items[].quantity`. Do not refactor this route to
accept an amount.

**The sales gate must stay the first thing the checkout route does.** It
returns before any Stripe call, which is what guarantees a card cannot be
charged for materials that do not exist yet.

**Sales tax is an open decision**, flagged in a comment above the checkout
route. Stripe direct makes the seller the merchant of record; a
merchant-of-record platform takes that on for a few points of revenue.

## Future member architecture

If real sales later justify persistent member access, read
`BACKEND_HANDOFF.md` first. The future architecture should reuse the existing
server-derived `entitlementSlugs` rather than redesigning product access.

## Route transition

`components/PageTransition.tsx` uses `AnimatePresence mode="popLayout"`, not
`mode="wait"`; the reason is documented in that file.
