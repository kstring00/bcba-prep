import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";
import { CartPanel } from "@/components/CartPanel";
import { Footer } from "@/components/Footer";
import { NavRail } from "@/components/NavRail";
import { PageTransition } from "@/components/PageTransition";
import { CartProvider } from "@/lib/cart-context";
import { ThemeProvider } from "@/lib/theme-context";
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
  title: "BCBA Prep — Sixth Edition",
  description: "[[TODO_SITE_META_DESCRIPTION]]",
};

export const viewport: Viewport = {
  themeColor: "#0D0B09",
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
        <ThemeProvider>
          <CartProvider>
            <div className="app">
              {/* The rail is fixed but carries no 3D transform, so the cart
                  button inside it is a valid flight target and stays put. */}
              <NavRail />
              <div className="main">
                <div className="shell">
                  <PageTransition>{children}</PageTransition>
                  <Footer />
                </div>
              </div>
            </div>
            <CartPanel />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
