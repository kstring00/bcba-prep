"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BeeMark } from "@/components/BeeMark";
import { domains } from "@/lib/domains";
import {
  AuthSession,
  refreshStoredSession,
  signOut,
} from "@/lib/supabase/auth-client";
import styles from "./member.module.css";
import compact from "./member-compact.module.css";

function CircleIcon({ children }: { children: ReactNode }) {
  return <span className={styles.circleIcon}>{children}</span>;
}

export default function MemberPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    refreshStoredSession().then((activeSession) => {
      if (!activeSession) {
        router.replace("/sign-in");
        return;
      }
      setSession(activeSession);
      setChecking(false);
    });
  }, [router]);

  async function handleSignOut() {
    await signOut();
    router.replace("/sign-in");
    router.refresh();
  }

  if (checking || !session) {
    return (
      <section className={styles.page}>
        <div className={styles.loading}>Opening your library…</div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={`${styles.heroWash} ${compact.heroWash}`} aria-hidden="true">
        <div className={`${styles.heroFloral} ${compact.heroFloral}`} />
        <div className={`${styles.heroBee} ${compact.heroBee}`}>
          <BeeMark size={30} />
        </div>
      </div>

      <div className={`${styles.shell} ${compact.shell}`}>
        <div className={styles.topline}>
          <Link href="/" className={styles.back}>
            <span aria-hidden="true">←</span> Browse all domains
          </Link>
          <button type="button" onClick={handleSignOut} className={styles.signOut}>
            Sign out <span aria-hidden="true">↗</span>
          </button>
        </div>

        <header className={`${styles.hero} ${compact.hero}`}>
          <p className={`${styles.script} ${compact.script}`}>Your library</p>
          <h1>
            Welcome to BCBA Prep
            <br />
            by Bee the Behavior Bae.
          </h1>
          <p>
            You’re signed in as <strong>{session.user.email ?? "your account"}</strong>.
          </p>
        </header>

        <div className={styles.dashboardGrid}>
          <aside className={styles.leftRail}>
            <section className={styles.panel}>
              <div className={styles.panelTitle}>
                <CircleIcon>◎</CircleIcon>
                <h2>Account overview</h2>
              </div>
              <p>
                You’re all set. When domain access is connected, your purchases
                will show up in your library automatically.
              </p>
              <Link href="/contact" className={styles.textLink}>
                Need account help <span aria-hidden="true">→</span>
              </Link>
            </section>

            <section className={`${styles.panel} ${styles.quickPanel}`}>
              <div className={styles.panelTitle}>
                <CircleIcon>☆</CircleIcon>
                <h2>Quick actions</h2>
              </div>
              <div className={styles.actions}>
                <Link href="/" className={styles.actionRow}>
                  <span className={styles.actionIcon}>▥</span>
                  <span>Explore the domain library</span>
                  <span aria-hidden="true">›</span>
                </Link>
                <Link href="/testimonials" className={styles.actionRow}>
                  <span className={styles.actionIcon}>♡</span>
                  <span>Read student kind words</span>
                  <span aria-hidden="true">›</span>
                </Link>
                <Link href="/contact" className={styles.actionRow}>
                  <span className={styles.actionIcon}>✉</span>
                  <span>Contact Bee</span>
                  <span aria-hidden="true">›</span>
                </Link>
              </div>
            </section>
          </aside>

          <section className={styles.libraryPanel} aria-labelledby="purchased-domains-title">
            <CircleIcon>▤</CircleIcon>
            <h2 id="purchased-domains-title">Your purchased domains</h2>
            <div className={styles.ornament} aria-hidden="true">
              <span />
              <BeeMark size={22} />
              <span />
            </div>

            <div className={styles.bookIllustration} aria-hidden="true">
              <span className={styles.bookOne} />
              <span className={styles.bookTwo} />
              <span className={styles.bookThree} />
              <span className={styles.flight}>···⌁</span>
            </div>

            <h3>No domains connected yet.</h3>
            <p>
              Your account layer is active. Once Stripe purchase syncing and
              entitlement fulfillment are connected, the domains licensed to
              this account will appear here automatically.
            </p>
            <Link href="/" className={styles.primaryCta}>
              Explore the domain library <span aria-hidden="true">→</span>
            </Link>
          </section>

          <aside className={styles.rightRail}>
            <section className={styles.panel}>
              <h2>What happens next</h2>
              <ol className={styles.timeline}>
                <li>
                  <span>1</span>
                  <div>
                    <strong>Account ready</strong>
                    <p>Your secure member account is already active.</p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <strong>Access unlocked</strong>
                    <p>Purchased domains will be connected to your library.</p>
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    <strong>Start studying</strong>
                    <p>Open your materials and work through your next domain.</p>
                  </div>
                </li>
              </ol>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelTitle}>
                <CircleIcon>⌁</CircleIcon>
                <div>
                  <h2>Your study journey</h2>
                  <p className={styles.microcopy}>Keep building your path to BCBA®.</p>
                </div>
              </div>
              <div className={styles.journeyList}>
                <div><span>✓</span><p><strong>Choose your focus</strong><small>Start with the domain you need most.</small></p></div>
                <div><span>↗</span><p><strong>Build momentum</strong><small>Move through materials intentionally.</small></p></div>
                <div><span>☆</span><p><strong>Celebrate progress</strong><small>Every completed domain moves you forward.</small></p></div>
              </div>
            </section>
          </aside>
        </div>

        <section className={styles.domainShelf}>
          <div className={styles.shelfHead}>
            <div>
              <p className={styles.shelfEyebrow}>Explore the domains</p>
              <h2>Browse the full A–I library.</h2>
            </div>
            <Link href="/" className={styles.textLink}>
              View all domains <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className={styles.domainGrid}>
            {domains.map((domain) => (
              <Link
                key={domain.slug}
                href={`/domain/${domain.slug}`}
                className={styles.domainCard}
                aria-label={`Explore Domain ${domain.letter}: ${domain.title}`}
              >
                <div className={styles.miniBook} style={{ background: domain.cloth }}>
                  <span style={{ color: domain.foil }}>6E</span>
                </div>
                <span className={styles.lock} aria-hidden="true">○</span>
                <p>Domain {domain.letter}</p>
                <strong>{domain.short}</strong>
                <small>{domain.percent}% of scored items</small>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
