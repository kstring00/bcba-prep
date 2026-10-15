import Link from "next/link";
import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/session";
import { SALES_ENABLED } from "@/lib/launch";
import { getStripe } from "@/lib/stripe";

export const metadata = { title: "Thank you" };
export const dynamic = "force-dynamic";

/**
 * Stripe's success_url lands here, and this page's whole job is to get out of
 * the way: confirm the payment, then send the buyer into My Library with the
 * thing they just bought highlighted.
 *
 * The session is re-read from Stripe rather than trusted from the query
 * string. `session_id` is in the URL and therefore editable, so it is used
 * only to LOOK UP the real session; the entitlements highlighted come from
 * Stripe's own copy of the metadata, and the actual grant was made by the
 * webhook. Nothing here grants anything.
 */
export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  if (!SALES_ENABLED) {
    return (
      <div className="shell">
        <div className="prose">
          <h1>Nothing to confirm yet</h1>
          <p>
            BCBA Prep is not selling yet, so there is no order attached to this
            page. If you reached it from an old link, nothing has been charged.
          </p>
          <p>
            If you believe you have been charged for something on this site,
            please <Link href="/contact">contact Bee</Link> so it can be looked
            into and refunded.
          </p>
          <Link href="/" className="back-link">
            &larr; Back to the stack
          </Link>
        </div>
      </div>
    );
  }

  const { session_id: sessionId } = await searchParams;
  const user = await getVerifiedUser();

  if (sessionId && user) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);

      // Only act on a paid session that belongs to the person looking at it.
      // Someone pasting another customer's session id gets the generic page.
      const belongsToUser =
        session.client_reference_id === user.id ||
        session.metadata?.user_id === user.id;

      if (session.payment_status === "paid" && belongsToUser) {
        const skus = session.metadata?.entitlement_skus ?? "";
        redirect(`/member?new=${encodeURIComponent(skus)}`);
      }
    } catch (error) {
      // A lookup failure must not strand the buyer on an error page. The
      // webhook has already granted access, so My Library is still correct.
      console.error("[thanks] session lookup failed", error);
    }
  }

  return (
    <div className="shell">
      <div className="prose">
        <h1>Thank you</h1>
        <p>
          Your payment went through. A receipt is on its way from Stripe to the
          email address you gave at checkout.
        </p>
        <p>
          Your purchase is attached to your account.{" "}
          <Link href="/member">Open My Library</Link> to start studying.
        </p>
        <p>
          If something is not showing up there within a few minutes, please{" "}
          <Link href="/contact">contact Bee</Link> and include the email
          address you paid with.
        </p>
        <Link href="/member" className="back-link">
          Go to My Library &rarr;
        </Link>
      </div>
    </div>
  );
}
