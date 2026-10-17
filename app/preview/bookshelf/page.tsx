import type { Metadata } from "next";
import Link from "next/link";
import { Bookshelf } from "@/components/Bookshelf";
import { getSessionUser } from "@/lib/auth/session";
import { domainSku, type Sku } from "@/lib/catalog";
import { domains } from "@/lib/domains";
import { getOwnedSkus } from "@/lib/entitlements/server";
import { SALES_ENABLED } from "@/lib/launch";
import styles from "./preview.module.css";

/*
 * /preview/bookshelf — the shelf, viewable before sales open.
 *
 * The real shelf sits in My Library behind NEXT_PUBLIC_SALES_ENABLED. This
 * route exists so the owner can look at it now, in both states. It is not
 * linked from anywhere, it is noindex on top of the site-wide noindex, and
 * it sells nothing: every locked spine goes to the same domain page the
 * home pile already links to.
 *
 * ?owned=A,C,E pretends those letters are owned, so both states can be seen
 * without a purchase. A signed-in member's real ownership is added too.
 */
export const metadata: Metadata = {
  title: "Bookshelf preview | BCBA Prep",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function BookshelfPreview({
  searchParams,
}: {
  searchParams: Promise<{ owned?: string }>;
}) {
  const { owned } = await searchParams;
  const letters = (owned ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const pretend: Sku[] = domains
    .filter((d) => letters.includes(d.letter))
    .map((d) => domainSku(d.slug));

  const user = await getSessionUser();
  const real = user ? await getOwnedSkus() : [];
  const ownedSkus = Array.from(new Set([...real, ...pretend]));

  return (
    <section className={styles.page}>
      <div className="container">
        <header className={styles.head}>
          <p className="eyebrow">Preview · not linked from the site</p>
          <h1 className="display-lg" id="shelf-title">
            The library bookshelf
          </h1>
          <p className="lede">
            Owned domains stand in colour and open; locked ones stand in grey
            and offer to unlock. Hover a book. On a phone, the shelf scrolls
            sideways.
          </p>
          <p className={styles.note}>
            Sales gate is <strong>{SALES_ENABLED ? "open" : "closed"}</strong>
            {" "}in this build. Add <code>?owned=A,C,E</code> to the address to
            pretend those domains are owned. Try{" "}
            <Link href="/preview/bookshelf?owned=A,B,C,D,E,F,G,H,I">all nine</Link>
            {", "}
            <Link href="/preview/bookshelf?owned=B,E,G">three</Link>
            {", or "}
            <Link href="/preview/bookshelf">none</Link>.
          </p>
        </header>

        <Bookshelf ownedSkus={ownedSkus} labelledBy="shelf-title" />
      </div>
    </section>
  );
}
