import Link from "next/link";
import { Motif } from "@/components/Motifs";
import { domainSku, type Sku } from "@/lib/catalog";
import { domains, isLightCloth, type Domain } from "@/lib/domains";
import styles from "./Bookshelf.module.css";

/**
 * The library bookshelf: nine spines standing on one shelf, facing the
 * viewer, one per domain A–I.
 *
 * Owned books are in full colour and open the member's materials. Locked
 * books stand in greyscale with a quiet "Unlock" that appears on hover and
 * focus (and is always readable to assistive tech), and open the domain's
 * page. Spine widths follow each domain's weight on the exam, so the shelf
 * carries the same information as the pile on the home page.
 *
 * Behind NEXT_PUBLIC_SALES_ENABLED on the live pages; see
 * app/preview/bookshelf for the always-on preview.
 */
type Props = {
  ownedSkus: Sku[];
  /** Heading level context: the shelf is a region, labelled by this id. */
  labelledBy?: string;
};

/* Hand-set height jitter (px) so the row reads as books, not bars. */
const LIFT = [0, 6, 2, 9, 4, 0, 7, 3, 5];

function spineWidth(d: Domain): number {
  // 5% → 59px, 14% → 85px. Wide enough for the name at every weight.
  return Math.round(44 + d.percent * 2.9);
}

export function Bookshelf({ ownedSkus, labelledBy }: Props) {
  const owns = (d: Domain) => ownedSkus.includes(domainSku(d.slug));
  const ownedCount = domains.filter(owns).length;

  return (
    <section className={styles.shelf} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : "Your bookshelf"}>
      <div className={styles.scroller}>
        <ul className={styles.row}>
          {domains.map((domain, i) => {
            const owned = owns(domain);
            const light = isLightCloth(domain);
            return (
              <li
                key={domain.slug}
                className={`${styles.slot}${owned ? "" : ` ${styles.locked}`}`}
                style={
                  {
                    "--w": `${spineWidth(domain)}px`,
                    "--lift": `${LIFT[i]}px`,
                    "--cloth": domain.cloth,
                    "--foil": domain.foil,
                  } as React.CSSProperties
                }
              >
                <Link
                  href={owned ? `/member/domain/${domain.slug}` : `/domain/${domain.slug}`}
                  className={styles.book}
                  aria-label={
                    owned
                      ? `Open Domain ${domain.letter}, ${domain.title}`
                      : `Domain ${domain.letter}, ${domain.title}. Not yet unlocked. Open the domain page.`
                  }
                >
                  <span className={`${styles.spine}${light ? ` ${styles.spineLight}` : ""}`}>
                    <span className={styles.top} aria-hidden="true" />
                    <span className={styles.letter}>{domain.letter}</span>
                    <span className={styles.rule} aria-hidden="true" />
                    <span className={styles.name}>{domain.short}</span>
                    <span className={styles.motif} aria-hidden="true">
                      <Motif slug={domain.slug} />
                    </span>
                    <span className={styles.edition} aria-hidden="true">6E</span>
                    <span className={styles.sheen} aria-hidden="true" />
                  </span>
                  {owned ? null : (
                    <span className={styles.unlock}>Unlock</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className={styles.board} aria-hidden="true" />
      </div>

      <p className={styles.caption}>
        {ownedCount === 0
          ? "Nine domains. Open one to unlock it."
          : ownedCount === domains.length
            ? "The complete library. Every domain is yours."
            : `${ownedCount} of ${domains.length} domains unlocked.`}
      </p>
    </section>
  );
}
