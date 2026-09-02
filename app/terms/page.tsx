import Link from "next/link";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>Terms of sale</h1>
        <p>
          BCBA Prep by Bee the Behavior Bae sells educational study-content
          licenses. By completing a purchase, you agree to these terms, the
          refund policy, and any applicable terms presented during checkout.
        </p>

        <h2>What you are buying</h2>
        <p>
          A purchase gives the individual purchaser a personal,
          non-transferable, non-exclusive license to access and use the BCBA
          Prep materials included in the domain or bundle purchased. You are
          buying permission to use the content for your own study; ownership of
          the underlying content and intellectual property does not transfer to
          you.
        </p>

        <h2>Personal use only</h2>
        <p>
          Purchased materials may not be resold, redistributed, uploaded to
          shared drives or public websites, reproduced for commercial use, or
          shared as a substitute for another person purchasing their own
          license. Account credentials and member access are also personal to
          the purchaser and may not be shared to provide access to others.
        </p>

        <h2>Bundles and domain access</h2>
        <p>
          A domain license covers the materials made available within that
          purchased domain. A bundle license covers the domains identified at
          checkout. Promotional bundle pricing changes the purchase price, not
          the personal-use nature of the license.
        </p>

        <h2>No guarantee of outcome</h2>
        <p>
          These are independent study materials. Nothing on this site or in the
          purchased materials guarantees that a purchaser will pass the BCBA
          examination or achieve any particular score or professional outcome.
        </p>

        <h2>Refunds</h2>
        <p>
          Because these are digital educational materials, purchases are final
          except where applicable law requires otherwise. If you have an access
          problem or believe something went wrong with your purchase, please
          contact Bee so the issue can be reviewed and addressed in good faith.
        </p>

        <h2>Marks</h2>
        <p>
          BACB<sup>&reg;</sup> and BCBA<sup>&reg;</sup> are registered marks of
          the Behavior Analyst Certification Board, used here only to identify
          the examination these materials are written for.
        </p>

        <Link href="/" className="back-link">
          &larr; Back to the stack
        </Link>
      </div>
    </div>
  );
}
