"use client";

import Link from "next/link";
import { useOwnership } from "@/lib/entitlements/context";

/**
 * The library link on the About page.
 *
 * Signed in → their library, because that is the next useful click for
 * somebody who already has materials. Signed out → the domains.
 *
 * Pre-launch, the founding list is the page's one gold action, so this
 * renders in the quiet secondary voice beside it (`quiet`). The solid
 * variant remains for when sales open.
 */
export function AboutCta({ quiet = false }: { quiet?: boolean }) {
  const { signedIn } = useOwnership();
  const className = quiet
    ? "link-gold about-cta-quiet"
    : "btn btn--solid btn--large";

  return signedIn ? (
    <Link href="/member" className={className}>
      Go to My Library <span aria-hidden="true">→</span>
    </Link>
  ) : (
    <Link href="/" className={className}>
      Start with a domain <span aria-hidden="true">→</span>
    </Link>
  );
}
