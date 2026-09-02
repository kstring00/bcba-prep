import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// Signature verification needs the raw body, so this must run on Node and the
// body must not be parsed before Stripe verifies it.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("[webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    // Checkout writes these values from the trusted server-side catalogue.
    // They are therefore the canonical description of what the customer
    // licensed; never replace them with entitlement values supplied by a
    // browser request.
    const entitlementSlugs = (session.metadata?.entitlement_slugs ?? "")
      .split(",")
      .map((slug) => slug.trim())
      .filter(Boolean);
    const licenseScope = session.metadata?.license_scope ?? "unknown";
    const email = session.customer_details?.email ?? null;

    /*
      FUTURE AUTOMATED FULFILMENT

      Persist event.id + session.id idempotently, associate the verified email
      / member account, and grant entitlementSlugs. Stripe may deliver the same
      event more than once, so future persistence MUST be unique on event.id or
      session.id before access is granted.

      Until automated entitlement storage is connected, Stripe itself remains
      the durable payment record and the session metadata records exactly which
      domain licenses were purchased.
    */
    console.log("[webhook] paid license", {
      eventId: event.id,
      sessionId: session.id,
      email,
      licenseScope,
      entitlementSlugs,
    });
  }

  return NextResponse.json({ received: true });
}
