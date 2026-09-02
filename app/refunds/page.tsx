import Link from "next/link";

export const metadata = { title: "Refund Policy" };

export default function RefundsPage() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>Refund Policy</h1>
        <p>
          Because BCBA Prep products are digital educational materials that may
          be accessed immediately after purchase, all purchases are final and
          non-refundable, except where a refund is required by applicable law.
        </p>

        <h2>Please review before purchasing</h2>
        <p>
          We encourage you to review the domain description and what is included
          before completing your purchase. If you have a question about whether
          a domain is right for you, you can contact Bee before buying, but you
          do not need approval or a consultation to make a purchase.
        </p>

        <h2>If something is not right</h2>
        <p>
          A final-sale policy does not mean we want to leave you stuck. If you
          are dissatisfied, have trouble accessing your purchase, believe you
          received the wrong materials, or encounter another issue, please reach
          out. Bee will work with you in good faith to understand the problem
          and find a reasonable solution when possible.
        </p>

        <p>
          Refunds are not offered simply because a customer changes their mind,
          no longer needs the materials, does not use the materials, or decides
          after purchase that the content is not a fit for their study plan.
        </p>

        <Link href="/contact" className="back-link">
          Contact Bee about a purchase
        </Link>
      </div>
    </div>
  );
}
