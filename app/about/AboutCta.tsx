"use client";

import Link from "next/link";
import { useOwnership } from "@/lib/entitlements/context";

/**
 * One call to action, and only one.
 *
 * Signed in → their library, because that is the next useful click for
 * somebody who already has materials. Signed out → the domains, which is
 * where buying starts.
 */
export function AboutCta() {
  const { signedIn } = useOwnership();

  return signedIn ? (
    <Link href="/member" className="btn btn--solid btn--large">
      Go to My Library <span aria-hidden="true">→</span>
    </Link>
  ) : (
    <Link href="/" className="btn btn--solid btn--large">
      Start with a domain <span aria-hidden="true">→</span>
    </Link>
  );
}
