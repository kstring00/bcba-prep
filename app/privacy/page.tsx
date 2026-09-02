import Link from "next/link";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>Privacy</h1>
        <p>[[TODO_PRIVACY]]</p>
        <h2>Payments</h2>
        <p>
          Payment is taken by Stripe on Stripe&rsquo;s own hosted checkout. Card
          details are entered on Stripe&rsquo;s page and are never sent to, or
          stored on, this site.
        </p>
        <h2>Your cart</h2>
        <p>
          The cart is held in memory for the length of your visit only. It is
          not written to your device and does not survive a page reload.
        </p>
        <Link href="/" className="back-link">
          &larr; Back to the stack
        </Link>
      </div>
    </div>
  );
}
