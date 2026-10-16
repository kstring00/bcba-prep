import type { NextConfig } from "next";

/**
 * Baseline security headers.
 *
 * Card data never touches this origin — Stripe Checkout is hosted on Stripe's
 * own domain — so these are defence in depth rather than PCI requirements.
 * They are still worth having: the site collects account credentials and
 * personal messages.
 *
 * The Content-Security-Policy below was added after enumerating every
 * third-party origin the site actually touches, and verified by loading each
 * page with it enforced and asserting zero CSP violations in the console.
 *
 * HONEST LIMIT — script-src carries 'unsafe-inline'. Next injects inline
 * bootstrap and hydration scripts, and the nonce-based alternative means
 * generating a nonce per request in middleware and threading it through. That
 * is worth doing, but it is a change with real breakage risk and it is not
 * what this policy is buying today: the app has no XSS sink to speak of
 * (React escapes everything, and the single dangerouslySetInnerHTML is built
 * from an env var validated against /^[a-zA-Z0-9]+$/). What this policy does
 * buy is the other half — connect-src and form-action bound the destinations
 * data could be sent to, frame-ancestors stops framing, and object-src 'none'
 * removes plugin content. Nonce-based script-src is the follow-up.
 */
/*
 * Every origin here is one the site genuinely loads. Keep this list honest:
 * an origin added "just in case" is a hole, and an origin removed by mistake
 * breaks a feature silently.
 *
 *   clarity.ms / bing.com   Microsoft Clarity analytics tag and its beacon
 *   *.supabase.co           auth, PostgREST reads, signed storage URLs
 *   open.spotify.com        the study-break playlist iframe
 *   *.scdn.co               Spotify's audio/artwork CDN, used by that iframe
 *   checkout.stripe.com     where the checkout form posts on redirect
 */
const csp = [
  "default-src 'self'",
  // See the note above on 'unsafe-inline'.
  "script-src 'self' 'unsafe-inline' https://www.clarity.ms https://*.clarity.ms",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.clarity.ms https://*.scdn.co https://i.scdn.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://*.clarity.ms https://c.bing.com",
  // The Spotify embed and Stripe's redirect targets.
  "frame-src https://open.spotify.com https://js.stripe.com https://hooks.stripe.com",
  "media-src 'self' https://*.scdn.co",
  // Nothing embeds this site. Modern equivalent of X-Frame-Options: DENY,
  // which is kept alongside it for older browsers.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
