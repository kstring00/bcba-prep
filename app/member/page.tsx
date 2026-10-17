import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BeeMark } from "@/components/BeeMark";
import { Bookshelf } from "@/components/Bookshelf";
import { LibrarySections } from "./LibrarySections";
import { SALES_ENABLED } from "@/lib/launch";
import { getSessionUser } from "@/lib/auth/session";
import { getOwnedSkus } from "@/lib/entitlements/server";
import { getLibraryContent } from "@/lib/entitlements/library";
import styles from "./member.module.css";
import compact from "./member-compact.module.css";

export const metadata: Metadata = {
  title: "My Library | BCBA Prep by Bee the Behavior Bae",
  description: "Open the BCBA Prep study materials and mock exams on your account.",
};

export const dynamic = "force-dynamic";

/**
 * My Library.
 *
 * Now a SERVER component. It was a client component that redirected in a
 * useEffect, which meant the page shell rendered for a signed-out visitor
 * before the redirect fired. The gate is server-side: a signed-out request
 * never receives the page at all.
 */
export default async function MemberPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/sign-in?next=/member");
  }

  const [ownedSkus, content] = await Promise.all([
    getOwnedSkus(),
    getLibraryContent(),
  ]);

  // Set by /thanks after a purchase, so the new item is highlighted rather
  // than leaving the buyer to hunt for what they just paid for.
  const { new: justPurchased } = await searchParams;
  const highlightSkus = (justPurchased ?? "")
    .split(",")
    .map((sku) => sku.trim())
    .filter(Boolean);

  return (
    <section className={styles.page}>
      <div className={`${styles.heroWash} ${compact.heroWash}`} aria-hidden="true">
        <div className={`${styles.heroFloral} ${compact.heroFloral}`} />
        <div className={`${styles.heroBee} ${compact.heroBee}`}>
          <BeeMark size={30} />
        </div>
      </div>

      <div className={`${styles.shell} ${compact.shell}`}>
        <div className={styles.topline}>
          <Link href="/" className={styles.back}>
            <span aria-hidden="true">←</span> Browse all domains
          </Link>
        </div>

        <header className={`${styles.hero} ${compact.hero}`}>
          <p className={`${styles.script} ${compact.script}`}>Your library</p>
          <h1>Welcome to BCBA Prep by Bee the Behavior Bae.</h1>
          <p>
            You&rsquo;re signed in as <strong>{user.email ?? "your account"}</strong>.
          </p>
        </header>

        {/* The bookshelf: nine spines, owned in colour, locked in grey.
            Behind the sales gate — before sales open every book is locked
            and a shelf of grey spines is a wall, not a library. Preview it
            any time at /preview/bookshelf. */}
        {SALES_ENABLED ? (
          <div className={styles.shelfWrap}>
            <h2 className={styles.shelfTitle} id="library-shelf">
              Your bookshelf
            </h2>
            <Bookshelf ownedSkus={ownedSkus} labelledBy="library-shelf" />
          </div>
        ) : null}

        <LibrarySections
          ownedSkus={ownedSkus}
          content={content}
          highlightSkus={highlightSkus}
        />
      </div>
    </section>
  );
}
