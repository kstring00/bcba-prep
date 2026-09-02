import { NextResponse } from "next/server";
import Stripe from "stripe";
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
        { error: "Domain licenses may only be purchased once per checkout." },
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

  if (pricing.total <= 0 || pricing.entitlementSlugs.length === 0) {
    return NextResponse.json({ error: "No valid licenses selected" }, { status: 400 });
  }

  const entitlementList = pricing.entitlementSlugs.join(",");

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
            entitlement_slugs: entitlementList,
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
      success_url: `${siteUrl()}/thanks?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/?cart=open`,
      metadata: {
        license_scope: "personal_non_transferable",
        entitlement_slugs: entitlementList,
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
