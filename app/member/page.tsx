"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BeeMark } from "@/components/BeeMark";
import {
  AuthSession,
  refreshStoredSession,
  signOut,
} from "@/lib/supabase/auth-client";
import styles from "./member.module.css";

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
      <div className={styles.shell}>
        <div className={styles.topline}>
          <Link href="/" className={styles.back}>
            ← Browse all domains
          </Link>
          <button type="button" onClick={handleSignOut} className={styles.signOut}>
            Sign out
          </button>
        </div>

        <div className={styles.hero}>
          <p className={styles.script}>Your library</p>
          <h1>Welcome to BCBA Prep by Bee the Behavior Bae.</h1>
          <p>
            You’re signed in as <strong>{session.user.email ?? "your account"}</strong>.
            This is the home that will hold the domains connected to your purchases.
          </p>
        </div>

        <div className={styles.libraryCard}>
          <div className={styles.monogram} aria-hidden="true">
            <BeeMark size={34} />
          </div>
          <div>
            <p className={styles.eyebrow}>Member access is active</p>
            <h2>Your purchased domains will appear here.</h2>
            <p>
              We’ve turned on the real account layer first. Domain purchase syncing
              is intentionally the next step, so we don’t pretend you own materials
              before Stripe and entitlement fulfillment are connected.
            </p>
          </div>
          <Link href="/" className={styles.cta}>
            Explore the domain library <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className={styles.note}>
          Your account is powered by the dedicated BCBA Prep authentication project.
          Payments remain handled by Stripe; purchase-to-library automation will be
          added when the product is ready for that step.
        </p>
      </div>
    </section>
  );
}
