"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { domainSlugFromSku, type Sku } from "@/lib/catalog";
import { getDomain } from "@/lib/domains";
import { readLastDomain } from "@/lib/study-break/prefs";
import styles from "./study-break.module.css";

/**
 * One soft CTA after a break, and only one.
 *
 * Signed in → back to the last domain they opened, by name, because that is
 * the single most likely next action. Falls back to any domain they own, then
 * to My Library.
 * Signed out → into the domains, which is where buying starts.
 *
 * Read on the client because the "last domain" lives in localStorage; it is a
 * per-device convenience, not something worth a database column.
 */
export function BreakCta({
  signedIn,
  ownedSkus,
}: {
  signedIn: boolean;
  ownedSkus: Sku[];
}) {
  const [lastSlug, setLastSlug] = useState<string | null>(null);

  useEffect(() => {
    setLastSlug(readLastDomain());
  }, []);

  if (!signedIn) {
    return (
      <Link href="/" className={styles.softCta}>
        Start with a domain <span aria-hidden="true">→</span>
      </Link>
    );
  }

  const ownedSlugs = ownedSkus
    .map((sku) => domainSlugFromSku(sku))
    .filter((slug): slug is string => Boolean(slug));

  // Only offer the remembered domain if they still own it.
  const target =
    lastSlug && ownedSlugs.includes(lastSlug) ? lastSlug : ownedSlugs[0] ?? null;

  if (!target) {
    return (
      <Link href="/member" className={styles.softCta}>
        Go to My Library <span aria-hidden="true">→</span>
      </Link>
    );
  }

  const domain = getDomain(target);

  return (
    <Link href={`/member/domain/${target}`} className={styles.softCta}>
      Back to {domain?.short ?? "your domain"} <span aria-hidden="true">→</span>
    </Link>
  );
}
