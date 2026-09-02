import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <Link
            href="/"
            className="brand"
            aria-label="BCBA Prep by Bryana Utley"
          >
            <span
              className="brand-mark"
              style={{ color: "var(--gold)" }}
              aria-hidden="true"
            >
              BP
            </span>
            <span className="brand-name" style={{ color: "var(--on-night)" }}>
              BCBA Prep
              <small style={{ color: "var(--on-night-dim)" }}>by Bryana</small>
            </span>
          </Link>
          <nav className="footer-links" aria-label="Legal">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refunds">Refunds</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>

        {/* Non-affiliation. Stays at the top of the footer body, not buried. */}
        <p className="disclaimer">[[TODO_DISCLAIMER]]</p>

        <p className="disclaimer">
          BACB<sup>&reg;</sup> and BCBA<sup>&reg;</sup> are registered marks of
          the Behavior Analyst Certification Board. They are used here only to
          identify the examination these materials are written for.
        </p>

        <p className="disclaimer">[[TODO_ABOUT_POSITIONING]]</p>
      </div>
    </footer>
  );
}
