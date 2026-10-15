import type { NextConfig } from "next";

/**
 * Baseline security headers.
 *
 * Card data never touches this origin — Stripe Checkout is hosted on Stripe's
 * own domain — so these are defence in depth rather than PCI requirements.
 * They are still worth having: the site collects account credentials and
 * personal messages.
 *
 * No Content-Security-Policy yet. Getting one right requires enumerating the
 * Clarity tag, the Supabase origin and Next's own inline bootstrap scripts,
 * and a CSP that is wrong fails silently in ways that are hard to notice. It
 * is listed in LAUNCH_CHECKLIST.md as a deliberate follow-up rather than
 * guessed at here.
 */
const securityHeaders = [
  // Stop the browser second-guessing declared content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // No framing: this site is never embedded, so clickjacking has no use case.
  { key: "X-Frame-Options", value: "DENY" },
  // Send the origin, not the full path, to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs these devices.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Two years, subdomains included. Vercel serves HTTPS only.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          /*
           * PRE-LAUNCH ONLY.
           *
           * Remove this single entry — not the security headers above it — at
           * the same time as the `robots` block in app/layout.tsx and the
           * disallow rule in app/robots.ts. All three must be flipped
           * together; see LAUNCH_CHECKLIST.md.
           */
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
