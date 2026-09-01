import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";
import Link from "next/link";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

// Self-hosted by next/font at build time: the font files are emitted into the
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
  themeColor: "#1C1A17",
  width: "device-width",
  initialScale: 1,
  // TikTok's in-app browser will happily zoom on a mistap; let it.
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
        <div className="page">
          <header className="site-header">
            <p className="site-title">
              <Link href="/">[[TODO_SITE_TITLE]]</Link>
            </p>
            <p className="site-tagline">[[TODO_SITE_TAGLINE]]</p>
          </header>
          <PageTransition>{children}</PageTransition>
        </div>
      </body>
    </html>
  );
}
