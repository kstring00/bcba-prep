import { NextResponse } from "next/server";
import { getProduct } from "@/lib/products";
import { getStripe, siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

/*
 * OPEN DECISION — SALES TAX. Not decided here.
 *
 * Taking payment through Stripe directly makes the seller the merchant of
 * record. For US digital goods that means the seller is responsible for
 * monitoring economic nexus per state, registering where thresholds are
 * crossed, and collecting and remitting sales tax. Stripe Tax will calculate
 * and collect, but it does not register or file on anyone's behalf.
 *
 * A merchant-of-record platform (Lemon Squeezy, Paddle) takes that liability
 * on entirely, at a cost of a few percentage points of revenue.
 *
 * Flagging, not choosing. The tradeoff is compliance burden versus margin,
 * and it is the project owner's call.
 */

/** The client may send ids and quantities. It may never send money. */
type IncomingItem = { productId: unknown; quantity: unknown };

const MAX_QUANTITY = 20;

export async function POST(request: Request) {
  let body: { items?: IncomingItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const lineItems: { price: string; quantity: number }[] = [];

  for (const item of items) {
    if (typeof item?.productId !== "string") {
      return NextResponse.json({ error: "Invalid item" }, { status: 400 });
    }

    // Price comes from the server-side catalogue, keyed by id. Anything the
    // client said about cost is ignored — it is not even read.
    const product = getProduct(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product: ${item.productId}` },
        { status: 400 },
      );
    }

    // Validate the request before checking configuration, so a malformed
    // quantity is always rejected as a bad request rather than being masked
    // by an unconfigured product.
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    if (!product.priceId || product.priceId.startsWith("[[TODO")) {
      return NextResponse.json(
        {
          error:
            "This product has no Stripe price configured yet. Fill in its priceId in lib/products.ts.",
        },
        { status: 503 },
      );
    }

    lineItems.push({ price: product.priceId, quantity });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      // Hosted Checkout. No custom card form anywhere in this codebase.
      ui_mode: "hosted",
      // Wallets are the point: most arrivals come from TikTok's in-app
      // browser, where Apple Pay and Google Pay convert far better than a
      // typed card.
      //
      // `payment_method_types` is deliberately NOT set. Omitting it puts the
      // session on the Dashboard's automatic payment methods, which surfaces
      // Apple Pay and Google Pay on eligible devices; naming `["card"]` here
      // would pin the session to cards and suppress the wallets. The one
      // remaining step is out of code: register the live domain under
      // Stripe > Settings > Payments > Payment method domains, or Apple Pay
      // will not appear in production.
      // Digital goods: nothing ships, so no address collection.
      billing_address_collection: "auto",
      success_url: `${siteUrl()}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/?cart=open`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Never echo the raw Stripe error to the client.
    console.error("[checkout]", error);
    return NextResponse.json(
      { error: "Could not start checkout" },
      { status: 500 },
    );
  }
}
