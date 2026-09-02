import Link from "next/link";
import { BeeMark } from "./BeeMark";
import brandStyles from "./Brand.module.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <Link
            href="/"
            className="brand"
            aria-label="BCBA Prep by Bee the Behavior Bae"
          >
            <span
              className={`brand-mark ${brandStyles.mark}`}
              style={{ color: "var(--gold)" }}
              aria-hidden="true"
            >
              <BeeMark size={38} />
            </span>
            <span className="brand-name" style={{ color: "var(--on-night)" }}>
              BCBA Prep
              <small
                className={brandStyles.tagline}
                style={{ color: "var(--on-night-dim)" }}
              >
                by Bee the Behavior Bae
              </small>
            </span>
          </Link>
          <nav className="footer-links" aria-label="Legal">
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/refunds">Refunds</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>

        <p className="disclaimer">
          <strong style={{ color: "var(--on-night)" }}>About these materials.</strong>{" "}
          BCBA Prep by Bee the Behavior Bae creates original study materials
          designed to help future BCBAs organize complex concepts, study with
          intention, and prepare with greater confidence. Each resource is
          built from Bee&apos;s own study process, experience, and hard work to
          make exam preparation clearer and more approachable.
        </p>

        <p className="disclaimer">
          <strong style={{ color: "var(--on-night)" }}>Educational disclaimer.</strong>{" "}
          BCBA Prep by Bee the Behavior Bae is an independent educational
          resource and is not affiliated with, endorsed by, or sponsored by the
          Behavior Analyst Certification Board (BACB<sup>&reg;</sup>). These
          materials are intended to support independent study and exam
          preparation and do not guarantee examination eligibility,
          examination performance, or a passing score. Users remain
          responsible for reviewing current BACB requirements, policies, and
          official examination information.
        </p>

        <p className="disclaimer">
          BACB<sup>&reg;</sup> and BCBA<sup>&reg;</sup> are registered marks of
          the Behavior Analyst Certification Board. They are used here only to
          identify the examination these materials are written to support.
        </p>
      </div>
    </footer>
  );
}
