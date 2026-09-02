import type { MetadataRoute } from "next";

/**
 * PRE-LAUNCH ONLY.
 *
 * The site is intentionally hidden from search engines while pricing,
 * content, licensing, and fulfilment are still being finalized.
 *
 * When Bee intentionally launches publicly, remove this disallow rule at the
 * same time as the root noindex metadata and the X-Robots-Tag header in
 * next.config.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
