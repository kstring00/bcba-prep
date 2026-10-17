import Link from "next/link";
import { FounderPortrait } from "@/app/about/FounderPortrait";
import { HexFrame } from "@/components/HexMotif";

/**
 * Short founder teaser on the homepage. She is the brand, so she appears
 * before the fold ends rather than only on a page people may never open.
 *
 * Shares FounderPortrait with the About page, so the branded fallback and the
 * one photo asset are defined in a single place.
 */
export function BryanaTeaser() {
  return (
    <aside className="bryana-teaser">
      {/* The motif's primary use: the founder in a hex frame, with the
          offset gold hairline behind. Sized in globals (.bryana-teaser). */}
      <HexFrame offset={8}>
        <FounderPortrait />
      </HexFrame>
      <div className="bryana-teaser-copy">
        <p>Hi, I&rsquo;m Bryana 🐝💗</p>
        <p>
          Six years in ABA, with a background in biology and healthcare
          administration. I write every study resource on this site myself.
        </p>
        <Link href="/about" className="text-link">
          Read my story <span aria-hidden="true">→</span>
        </Link>
      </div>
    </aside>
  );
}
