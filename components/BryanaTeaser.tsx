import Link from "next/link";

/**
 * Short founder teaser on the homepage. She is the brand, so she appears
 * before the fold ends rather than only on a page people may never open.
 *
 * Uses the same /public/bryana.jpg as the About page — one asset, two places.
 * The file does not exist yet; see the TODO in app/about/page.tsx.
 */
export function BryanaTeaser() {
  return (
    <aside className="bryana-teaser">
      <img
        src="/bryana.jpg"
        alt="Bryana, founder of Bee the Behavior Bae"
        width={248}
        height={248}
      />
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
