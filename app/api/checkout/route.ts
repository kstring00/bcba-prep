import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getVerifiedUser } from "@/lib/auth/session";
import { getOwnedSkus } from "@/lib/entitlements/server";
import { PRE_LAUNCH_API_MESSAGE, SALES_ENABLED, liveModeBlocked } from "@/lib/launch";
import { getLicensePricing, getProduct } from "@/lib/products";
import { getStripe, siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

/*
 * OPEN DECISION — SALES TAX.
 * Taking payment through Stripe directly makes the seller the merchant of
 * record. Stripe Tax can calculate/collect where configured, but registration
 * and filing obligations remain with the seller.
 */

type IncomingItem = { productId: unknown; quantity: unknown };

export async function POST(request: Request) {
  /*
   * GATE 1 — PRE-LAUNCH. Must stay first.
   *
   * Nothing below may run while the store is closed. Returning before any
   * Stripe call is what guarantees a real card cannot be charged for
   * materials that do not exist yet. A hand-written POST reaches this route
   * directly, so this check — not the hidden buy buttons — is the protection.
   */
  if (!SALES_ENABLED) {
    return NextResponse.json({ error: PRE_LAUNCH_API_MESSAGE }, { status: 503 });
  }

  /*
   * GATE 2 — LIVE-MODE GUARD.
   *
   * Opening the store for test-mode QA must not also arm real payments. A
   * live secret key is refused unless someone has explicitly said live
   * payments are intended. Protects against the single worst mistake here:
   * flipping sales on while live keys happen to be in the environment.
   */
  const liveBlock = liveModeBlocked();
  if (liveBlock) {
    console.error("[checkout] refused:", liveBlock);
    return NextResponse.json(
      { error: "Checkout is not available right now." },
      { status: 503 },
    );
  }

  /*
   * GATE 3 — SIGN-IN REQUIRED.
   *
   * Verified against Supabase, not merely decoded from a cookie. This is what
   * makes fulfilment reliable: the Stripe session carries this user's id, so
   * the webhook attaches the purchase to a real account instead of trying to
   * match on a typed email afterwards. No account, no checkout.
   */
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json(
      {
        error: "Please sign in before checking out, so your purchase is saved to your account.",
        requiresSignIn: true,
      },
      { status: 401 },
    );
  }

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

  const productIds: string[] = [];

  for (const item of items) {
    if (typeof item?.productId !== "string") {
      return NextResponse.json({ error: "Invalid item" }, { status: 400 });
    }

    // A content license is unique per product. Quantity is fixed at one.
    if (Number(item.quantity) !== 1) {
      return NextResponse.json(
        { error: "Licenses may only be purchased once per checkout." },
        { status: 400 },
      );
    }

    if (!getProduct(item.productId)) {
      return NextResponse.json(
        { error: `Unknown product: ${item.productId}` },
        { status: 400 },
      );
    }

    productIds.push(item.productId);
  }

  const uniqueProductIds = Array.from(new Set(productIds));
  const pricing = getLicensePricing(uniqueProductIds);

  if (pricing.total <= 0 || pricing.entitlementSkus.length === 0) {
    return NextResponse.json({ error: "No valid licenses selected" }, { status: 400 });
  }

  /*
   * GATE 4 — NOBODY PAYS TWICE FOR THE SAME THING.
   *
   * Refuses only when EVERY sku in the cart is already owned. Partial overlap
   * is allowed on purpose: somebody who owns one domain and now wants the
   * complete bundle must be able to buy it, and blocking that would make
   * upgrading impossible. The webhook upserts on (user_id, sku), so the
   * domain they already had is re-granted harmlessly rather than duplicated.
   *
   * This mirrors lib/cart-context.tsx, which blocks an add on the same "all
   * owned" rule. The two layers must agree; if they diverge, a customer sees
   * a button that leads to a refusal.
   */
  const owned = await getOwnedSkus();
  const alreadyOwned = pricing.entitlementSkus.filter((sku) => owned.includes(sku));
  if (
    alreadyOwned.length > 0 &&
    alreadyOwned.length === pricing.entitlementSkus.length
  ) {
    return NextResponse.json(
      {
        error: "You already own everything in your cart. Open it from My Library.",
        alreadyOwned,
      },
      { status: 409 },
    );
  }

  const entitlementList = pricing.entitlementSkus.join(",");

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: pricing.total,
        product_data: {
          name: pricing.checkoutName,
          description: pricing.checkoutDescription,
          metadata: {
            license_scope: "personal_non_transferable",
            entitlement_skus: entitlementList,
          },
        },
      },
    },
  ];

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      ui_mode: "hosted",
      billing_address_collection: "auto",
      // Pre-filling from the account keeps the Stripe receipt and the
      // entitlement on the same address, which makes support far easier.
      customer_email: user.email ?? undefined,
      success_url: `${siteUrl()}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/?cart=open`,
      // client_reference_id is the join key the webhook grants against. It is
      // written here, server-side, from a verified session — never from the
      // browser, and never inferred from a typed email.
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        license_scope: "personal_non_transferable",
        entitlement_skus: entitlementList,
        source_product_ids: uniqueProductIds.join(","),
        pricing_tier: pricing.label ?? "individual",
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 502 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Never echo raw Stripe errors or configuration details to the client.
    console.error("[checkout]", error);
    return NextResponse.json(
      { error: "Could not start secure checkout" },
      { status: 500 },
    );
  }
}
