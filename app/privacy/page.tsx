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

        <h2>Microsoft Clarity</h2>
        <p>
          When Microsoft Clarity is enabled on this site, it may be used to
          understand how visitors move through and interact with the website,
          including aggregated usage patterns, heatmaps, and session
          recordings. Clarity is used to help improve the site experience, not
          to determine access to purchased materials.
        </p>
        <p>
          Microsoft states that Clarity masks sensitive content by default. Any
          production use of Clarity should also follow the consent and privacy
          requirements that apply to this site&rsquo;s visitors.
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
