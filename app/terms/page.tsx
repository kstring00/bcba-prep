import Link from "next/link";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="prose">
      <h1>Terms of sale</h1>
      <p>[[TODO_TERMS]]</p>
      <h2>What you are buying</h2>
      <p>[[TODO_TERMS_LICENCE]]</p>
      <h2>No guarantee of outcome</h2>
      <p>
        These are study materials. Nothing here is a guarantee that you will
        pass the examination, and no claim to that effect is made anywhere on
        this site.
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
  );
}
