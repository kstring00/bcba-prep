import Link from "next/link";
import { SALES_ENABLED } from "@/lib/launch";

export const metadata = { title: "Thank you" };

/**
 * Stripe's success_url lands here.
 *
 * While the pre-launch gate is closed nobody can reach this page from a real
 * payment — app/api/checkout/route.ts refuses to create a session at all. The
 * page still has to say something sensible, because the URL stays reachable
 * by hand, by a stale bookmark, or by a back-button after a cancelled attempt.
 */
export default function ThanksPage() {
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

  return (
    <div className="shell">
      <div className="prose">
        <h1>Thank you</h1>
        <p>
          Your payment went through. A receipt is on its way from Stripe to the
          email address you gave at checkout.
        </p>
        <p>
          Your study materials are sent by email, by hand, from the address you
          used at checkout. Please allow up to one business day. If nothing has
          arrived by then, <Link href="/contact">contact Bee</Link> and include
          the email address you paid with.
        </p>
        <p>
          Keep your Stripe receipt. It is the record of exactly which domains
          you licensed.
        </p>
        <Link href="/" className="back-link">
          &larr; Back to the stack
        </Link>
      </div>
    </div>
  );
}
