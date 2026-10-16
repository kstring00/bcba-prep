"use client";

import { useEffect } from "react";
import { rememberLastDomain } from "@/lib/study-break/prefs";

/**
 * Records which domain a member last opened, so the Study Break page can
 * offer "Back to Measurement →" instead of a generic link.
 *
 * Renders nothing. localStorage rather than a database column: it is a
 * per-device convenience and nothing breaks when it is absent.
 */
export function RememberDomain({ slug }: { slug: string }) {
  useEffect(() => {
    rememberLastDomain(slug);
  }, [slug]);

  return null;
}
