import Link from "next/link";

export const metadata = { title: "Thank you" };

export default function ThanksPage() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>Thank you</h1>
        <p>
          Your payment went through. A receipt is on its way from Stripe to the
          email address you gave at checkout.
        </p>
        {/* Delivery itself is [[TODO_FULFILMENT]] in app/api/webhook/route.ts. */}
        <p>[[TODO_DELIVERY_NOTE]]</p>
        <Link href="/" className="back-link">
          &larr; Back to the stack
        </Link>
      </div>
    </div>
  );
}
