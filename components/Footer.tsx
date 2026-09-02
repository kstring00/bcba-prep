import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <nav className="footer-links">
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/refunds">Refunds</Link>
      </nav>

      {/* Non-affiliation. Must stay above the fold of the footer, not buried. */}
      <p className="disclaimer">[[TODO_DISCLAIMER]]</p>

      <p className="disclaimer">
        BACB<sup>&reg;</sup> and BCBA<sup>&reg;</sup> are registered marks of
        the Behavior Analyst Certification Board. They are used here only to
        identify the examination these materials are written for.
      </p>

      <p className="disclaimer">[[TODO_ABOUT_POSITIONING]]</p>
    </footer>
  );
}
