import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The contact page is a client component (it owns form state), and a client
 * component cannot export `metadata`. A tiny server layout beside it is the
 * supported way to give the route its own title and description, which it
 * previously inherited from the site root.
 */
export const metadata: Metadata = {
  title: "Contact Bee | BCBA Prep by Bee the Behavior Bae",
  description:
    "Questions about a domain, a mock exam, or your purchase? Send Bryana a note and it goes straight to her email.",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children;
}
