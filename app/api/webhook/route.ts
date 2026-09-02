import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// Signature verification needs the raw body, so this must run on Node, not
// the edge, and the body must not be parsed before it is verified.
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
    // An unverified payload is not a customer event. Reject it.
    console.error("[webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    /*
      [[TODO_FULFILMENT]]

      Deliver the purchased modules to session.customer_details?.email.
      Not built in this pass.

      Two things whoever builds it will need:
      - Stripe retries on non-2xx, and can deliver the same event more than
        once, so fulfilment must be idempotent on event.id.
      - The line items are not on the session object as delivered; fetch them
        with stripe.checkout.sessions.listLineItems(session.id).
    */
    console.log("[webhook] paid session", session.id);
  }

  // Acknowledge everything else so Stripe stops retrying.
  return NextResponse.json({ received: true });
}
