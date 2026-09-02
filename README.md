# BCBA Prep

Study-materials store for BCBA exam candidates. Nine content domains are a
vertical pile of hardcover books; clicking one folds it open into a detail
view with contents and price. Items go into an in-memory cart and check out
through Stripe.

Next.js App Router · TypeScript · Motion · Stripe · CSS 3D transforms only
(no WebGL, no Three.js, no 3D assets, no image sequences).

## Status

Stack, detail view, cart and checkout. The study-content reader is not built.
No prices, product copy, or BCBA subject matter is written here — every such
value is a `[[TODO_...]]` token.

```sh
grep -rn '\[\[TODO_' --include='*.ts' --include='*.tsx' .
```

Two categories of real content DO ship:

- **`lib/domains.ts`** — the nine domain titles, short labels, question
  counts and percentages, supplied by the project owner as verified against
  the BACB Test Content Outline. Counts sum to 175, percentages to 100.
- **Hero copy in `app/page.tsx`** — transcribed from the reference design the
  owner supplied, not written here. Worth a read-through before launch.

## Setup

```sh
npm install
cp .env.example .env.local   # then fill in your Stripe keys
npm run dev
```

Checkout stays disabled (503) until real Stripe price IDs replace the
`[[TODO_PRODUCT_*_PRICE_ID]]` tokens in `lib/products.ts`.

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

**Two cart controls are mounted at once** — one in the fixed rail, one in the
mobile top bar — and only one is displayed at a given width. Anything that
targets "the cart" must pick the one with a non-zero box, and the impact
registry broadcasts to a Set rather than a single slot. A single slot hands
the knock to whichever mounted last, which is the hidden one.

**Prices are never taken from the client.** `app/api/checkout/route.ts`
receives product ids and quantities only, and resolves every line against
`lib/products.ts` server-side.

**Sales tax is an open decision**, flagged in a comment above the checkout
route. Stripe direct makes the seller the merchant of record; a
merchant-of-record platform takes that on for a few points of revenue.

## Theme

The sun control in the rail switches a `cloth` (dark) and `paper` (light)
palette. Both are one token block each in `globals.css`; the cloth colours of
the books deliberately do not move between them. State is in memory for the
session — no localStorage or sessionStorage anywhere in this app.

## Route transition

`components/PageTransition.tsx` uses `AnimatePresence mode="popLayout"`, not
`mode="wait"`; the reason is documented in that file.
