import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Parisienne } from "next/font/google";
import { CartPanel } from "@/components/CartPanel";
import { Footer } from "@/components/Footer";
import { MicrosoftClarity } from "@/components/MicrosoftClarity";
import { PageTransition } from "@/components/PageTransition";
import { SiteHeader } from "@/components/SiteHeader";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

// Self-hosted by next/font at build time: the files are emitted into this
// app's own static output and preloaded. No CDN request at runtime.
const display = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-display",
});

const script = Parisienne({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-script",
});

// UI chrome runs on the system stack — nothing to download.
const SANS_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const metadata: Metadata = {
  title: "BCBA Prep by Bee the Behavior Bae",
  description: "[[TODO_SITE_META_DESCRIPTION]]",
  // PRE-LAUNCH: keep every route out of public search results until Bee is
  // ready to launch. Remove this together with the X-Robots-Tag header and
  // app/robots.ts when indexing is intentionally enabled.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-snippet": 0,
      "max-image-preview": "none",
      "max-video-preview": 0,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#F8F3EC",
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
    <html lang="en" className={`${display.variable} ${script.variable}`}>
      <body style={{ "--font-sans": SANS_STACK } as React.CSSProperties}>
        <CartProvider>
          <SiteHeader />
          {/* Pages own their own container: several sections are full-bleed
              bands, which a shared max-width wrapper would cut off. */}
          <main className="main">
            <PageTransition>{children}</PageTransition>
          </main>
          <Footer />
          <CartPanel />
        </CartProvider>
        <MicrosoftClarity />
      </body>
    </html>
  );
}
