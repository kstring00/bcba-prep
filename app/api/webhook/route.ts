import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { adminHeaders, hasServiceRole, restUrl } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// Signature verification needs the raw body, so this must run on Node and the
// body must not be parsed before Stripe verifies it.
export const runtime = "nodejs";

/**
 * FULFILLMENT.
 *
 * Stripe is the only thing that may tell this route a payment happened, and
 * the signature check below is what proves it. Everything granted comes from
 * the session metadata that app/api/checkout/route.ts wrote server-side from
 * the trusted catalog — never from anything a browser sent.
 *
 * Writes use the service-role key because there is no user session here:
 * Stripe is the caller, not the buyer's browser. That is also why RLS has no
 * INSERT policy for `authenticated` on these tables.
 */

type GrantInput = {
  userId: string;
  sessionId: string;
  paymentIntentId: string | null;
  amountTotal: number | null;
  currency: string | null;
  email: string | null;
  skus: string[];
};

/**
 * Records the event id and reports whether this is the first time we have
 * seen it.
 *
 * Stripe retries deliveries; the same event arriving twice is routine, not
 * exceptional. Inserting here FIRST and treating a 409 (unique violation) as
 * "already handled" is what makes a replay a no-op instead of a second grant.
 */
async function claimEvent(event: Stripe.Event): Promise<boolean> {
  const response = await fetch(restUrl("/rest/v1/webhook_events"), {
    method: "POST",
    headers: { ...adminHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ event_id: event.id, event_type: event.type }),
  });

  if (response.status === 409) return false; // seen before
  if (!response.ok) {
    throw new Error(
      `webhook_events insert failed (${response.status}) ${await response
        .text()
        .catch(() => "")}`,
    );
  }
  return true;
}

async function recordPurchase(input: GrantInput): Promise<string | null> {
  const response = await fetch(
    restUrl("/rest/v1/purchases?on_conflict=stripe_checkout_session_id"),
    {
      method: "POST",
      headers: {
        ...adminHeaders(),
        // merge-duplicates + return=representation gives us the row id
        // whether this is the first write or a retry of the same session.
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        user_id: input.userId,
        stripe_checkout_session_id: input.sessionId,
        stripe_payment_intent_id: input.paymentIntentId,
        status: "paid",
        amount_total: input.amountTotal,
        currency: input.currency,
        purchaser_email: input.email,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `purchases upsert failed (${response.status}) ${await response
        .text()
        .catch(() => "")}`,
    );
  }

  const rows = (await response.json()) as Array<{ id?: string }>;
  return rows[0]?.id ?? null;
}

async function grantEntitlements(
  userId: string,
  purchaseId: string | null,
  skus: string[],
): Promise<void> {
  if (skus.length === 0) return;

  const rows = skus.map((sku) => ({
    user_id: userId,
    sku,
    source_purchase_id: purchaseId,
    active: true,
    revoked_at: null,
  }));

  // Upsert on (user_id, sku): re-buying something already owned must not
  // create a second row, and a retried event must land on the same rows.
  const response = await fetch(
    restUrl("/rest/v1/entitlements?on_conflict=user_id,sku"),
    {
      method: "POST",
      headers: {
        ...adminHeaders(),
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(rows),
    },
  );

  if (!response.ok) {
    throw new Error(
      `entitlements upsert failed (${response.status}) ${await response
        .text()
        .catch(() => "")}`,
    );
  }
}

/** Marks a purchase refunded/disputed and revokes what it granted. */
async function revokeForPaymentIntent(
  paymentIntentId: string,
  status: "refunded" | "disputed",
): Promise<void> {
  const lookup = await fetch(
    restUrl(
      `/rest/v1/purchases?select=id&stripe_payment_intent_id=eq.${encodeURIComponent(
        paymentIntentId,
      )}`,
    ),
    { headers: adminHeaders() },
  );
  if (!lookup.ok) return;

  const purchases = (await lookup.json()) as Array<{ id: string }>;
  for (const purchase of purchases) {
    await fetch(
      restUrl(`/rest/v1/purchases?id=eq.${encodeURIComponent(purchase.id)}`),
      {
        method: "PATCH",
        headers: { ...adminHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ status }),
      },
    );
    await fetch(
      restUrl(
        `/rest/v1/entitlements?source_purchase_id=eq.${encodeURIComponent(
          purchase.id,
        )}`,
      ),
      {
        method: "PATCH",
        headers: { ...adminHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ active: false, revoked_at: new Date().toISOString() }),
      },
    );
  }
}

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

  if (!hasServiceRole()) {
    // 500 on purpose: Stripe retries a 500, so the payment is not silently
    // lost while the key is missing. A 200 here would discard the event.
    console.error("[webhook] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  try {
    const firstTime = await claimEvent(event);
    if (!firstTime) {
      console.log("[webhook] duplicate event ignored", event.id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true, ignored: "unpaid" });
      }

      const skus = (session.metadata?.entitlement_skus ?? "")
        .split(",")
        .map((sku) => sku.trim())
        .filter(Boolean);

      // The join key. Written server-side at checkout from a verified
      // session, so it is trustworthy. Without it there is nobody to grant
      // to, and guessing from the typed email is exactly the ambiguity that
      // requiring sign-in removes.
      const userId = session.client_reference_id ?? session.metadata?.user_id ?? null;

      if (!userId || skus.length === 0) {
        console.error("[webhook] paid session without user id or skus", {
          sessionId: session.id,
          hasUser: Boolean(userId),
          skuCount: skus.length,
        });
        // 200: retrying cannot fix missing metadata. Surfaced loudly in logs
        // for manual reconciliation from the Stripe dashboard.
        return NextResponse.json({ received: true, needsManualReview: true });
      }

      const purchaseId = await recordPurchase({
        userId,
        sessionId: session.id,
        paymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        amountTotal: session.amount_total ?? null,
        currency: session.currency ?? null,
        email: session.customer_details?.email ?? null,
        skus,
      });

      await grantEntitlements(userId, purchaseId, skus);

      console.log("[webhook] granted", {
        eventId: event.id,
        sessionId: session.id,
        userId,
        skus,
      });
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      if (typeof charge.payment_intent === "string") {
        await revokeForPaymentIntent(charge.payment_intent, "refunded");
      }
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object;
      if (typeof dispute.payment_intent === "string") {
        await revokeForPaymentIntent(dispute.payment_intent, "disputed");
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    /*
     * 500 so Stripe retries.
     *
     * The event id is already recorded, so a naive retry would be treated as
     * a duplicate and skipped — losing the grant. Release the claim first so
     * the retry genuinely re-runs.
     */
    console.error("[webhook] fulfillment failed", error);
    try {
      await fetch(
        restUrl(`/rest/v1/webhook_events?event_id=eq.${encodeURIComponent(event.id)}`),
        { method: "DELETE", headers: adminHeaders() },
      );
    } catch (cleanupError) {
      console.error("[webhook] could not release event claim", cleanupError);
    }
    return NextResponse.json({ error: "Fulfillment failed" }, { status: 500 });
  }
}
