import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";
import Link from "next/link";
import { CartButton } from "@/components/CartButton";
import { CartPanel } from "@/components/CartPanel";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

// Self-hosted by next/font at build time: the files are emitted into this
// app's own static output and preloaded. No CDN request at runtime.
const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-serif",
});

// UI chrome runs on the system stack — nothing to download.
const SANS_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const metadata: Metadata = {
  title: "[[TODO_SITE_TITLE]]",
  description: "[[TODO_SITE_TAGLINE]]",
};

export const viewport: Viewport = {
  themeColor: "#141210",
  width: "device-width",
  initialScale: 1,
  // TikTok's in-app browser will zoom on a mistap; let it.
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={newsreader.variable}>
      <body style={{ "--font-sans": SANS_STACK } as React.CSSProperties}>
        <CartProvider>
          <div className="shell">
            {/* Sticky, not fixed. A fixed element inside a 3D-transformed
                ancestor takes that ancestor as its containing block and stops
                tracking the viewport; this bar lives outside the stack's
                transformed subtree either way. */}
            <div className="sticky-bar">
              <CartButton />
            </div>

            <header className="masthead">
              <p className="site-title">
                <Link href="/">[[TODO_SITE_TITLE]]</Link>
              </p>
            </header>
            <hr className="hairline hairline--foil" />

            <PageTransition>{children}</PageTransition>

            <Footer />
          </div>
          <CartPanel />
        </CartProvider>
      </body>
    </html>
  );
}
