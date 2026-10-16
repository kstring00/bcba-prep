import Link from "next/link";
import { domains } from "@/lib/domains";
import {
  domainSku,
  examSku,
  isPurchasable,
  mockExams,
  type Sku,
} from "@/lib/catalog";
import { contentForSku, type ContentItem } from "@/lib/entitlements/library";
import styles from "./member.module.css";

/**
 * The library, split into two sections because they are two product lines:
 * domain study materials, and mock exams. A candidate can own either without
 * the other, so neither section nests inside the other.
 *
 * Every row is either owned (opens) or not owned (links to its sales page).
 * There is no third state and no buy button on an owned row.
 */
type Props = {
  ownedSkus: Sku[];
  content: ContentItem[];
  /** SKUs just purchased, highlighted so the buyer lands on what they bought. */
  highlightSkus: string[];
};

function ContentRows({ items }: { items: ContentItem[] }) {
  if (items.length === 0) {
    return (
      <p className={styles.libraryEmptyNote}>
        Bee is still loading the files for this one. They will appear here as
        soon as they are published — nothing more to buy.
      </p>
    );
  }

  return (
    <ul className={styles.contentList}>
      {items.map((item) => (
        <li key={item.id}>
          {item.kind === "file" ? (
            // A plain link, not fetch(): the route answers with a 302 to a
            // 60-second signed URL, and letting the browser follow it starts
            // the download without holding the file in JavaScript memory.
            <a
              href={`/api/content/${item.id}`}
              className={styles.contentLink}
              // Downloads must never be prefetched — each prefetch would burn
              // a signed URL for a file nobody asked for yet.
              rel="nofollow"
            >
              <span className={styles.contentIcon} aria-hidden="true">
                ▤
              </span>
              <span>
                <strong>{item.title}</strong>
                {item.description ? <small>{item.description}</small> : null}
              </span>
              <span className={styles.contentAction} aria-hidden="true">
                Download
              </span>
            </a>
          ) : (
            <div className={`${styles.contentLink} ${styles.contentPending}`}>
              <span className={styles.contentIcon} aria-hidden="true">
                ◷
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>
                  Interactive version is being built. Your access is already
                  recorded.
                </small>
              </span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function LibrarySections({ ownedSkus, content, highlightSkus }: Props) {
  const owns = (sku: Sku) => ownedSkus.includes(sku);

  const ownedDomains = domains.filter((d) => owns(domainSku(d.slug)));
  const lockedDomains = domains.filter((d) => !owns(domainSku(d.slug)));
  const ownedExams = mockExams.filter((e) => owns(e.sku));
  const lockedExams = mockExams.filter((e) => !owns(e.sku));

  const nothingOwned = ownedDomains.length === 0 && ownedExams.length === 0;

  return (
    <>
      {highlightSkus.length > 0 ? (
        <div className={styles.purchaseBanner} role="status">
          <strong>Thank you — your purchase is unlocked.</strong>
          <p>Your new material is marked below and ready to open.</p>
        </div>
      ) : null}

      {/* The study break belongs in the daily routine, so it sits inside the
          library rather than only in the nav. */}
      <aside className={styles.breakPromo}>
        <div>
          <p className={styles.breakPromoEyebrow}>Take a breath</p>
          <strong>Study Break</strong>
          <p>Focus timer, breathing, desk stretches, and a place for your wins.</p>
        </div>
        <Link href="/study-break" className={styles.breakPromoLink}>
          Open Study Break <span aria-hidden="true">→</span>
        </Link>
      </aside>

      {nothingOwned ? (
        <section className={styles.libraryPanel}>
          <h2>Nothing in your library yet</h2>
          <p>
            When you buy a domain or a mock exam it appears here straight
            away, ready to open.
          </p>
          <Link href="/" className={styles.primaryCta}>
            Browse the domain library <span aria-hidden="true">→</span>
          </Link>
        </section>
      ) : null}

      {/* ---------------- Domain study materials ---------------- */}
      <section
        className={styles.librarySection}
        aria-labelledby="my-domains-title"
      >
        <div className={styles.sectionHead}>
          <h2 id="my-domains-title">Study materials</h2>
          <p>The nine BACB domains.</p>
        </div>

        {ownedDomains.map((domain) => {
          const sku = domainSku(domain.slug);
          const isNew = highlightSkus.includes(sku);
          return (
            <article
              key={domain.slug}
              id={`sku-${domain.slug}`}
              className={`${styles.ownedCard}${isNew ? ` ${styles.ownedCardNew}` : ""}`}
            >
              <div className={styles.ownedCardHead}>
                <span
                  className={styles.ownedSpine}
                  style={{ background: domain.cloth, color: domain.foil }}
                  aria-hidden="true"
                >
                  {domain.letter}
                </span>
                <div>
                  <h3>
                    Domain {domain.letter} — {domain.title}
                  </h3>
                  <p>{domain.percent}% of scored items</p>
                </div>
                {isNew ? <span className={styles.newFlag}>New</span> : null}
              </div>
              <ContentRows items={contentForSku(content, sku)} />
            </article>
          );
        })}

        {lockedDomains.length > 0 ? (
          <div className={styles.lockedGrid}>
            <p className={styles.lockedHeading}>
              {ownedDomains.length > 0
                ? "Not in your library yet"
                : "Available domains"}
            </p>
            {lockedDomains.map((domain) => (
              <Link
                key={domain.slug}
                href={`/domain/${domain.slug}`}
                className={styles.lockedCard}
              >
                <span
                  className={styles.lockedSpine}
                  style={{ background: domain.cloth, color: domain.foil }}
                  aria-hidden="true"
                >
                  {domain.letter}
                </span>
                <span>
                  <strong>Domain {domain.letter}</strong>
                  <small>{domain.short}</small>
                </span>
                <span className={styles.unlockAction}>Unlock</span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* ---------------- Mock exams ---------------- */}
      <section
        className={styles.librarySection}
        aria-labelledby="my-exams-title"
      >
        <div className={styles.sectionHead}>
          <h2 id="my-exams-title">Mock exams</h2>
          <p>Full-length practice, separate from the domain materials.</p>
        </div>

        {ownedExams.map((exam) => {
          const isNew = highlightSkus.includes(exam.sku);
          return (
            <article
              key={exam.id}
              id={`sku-${exam.id}`}
              className={`${styles.ownedCard}${isNew ? ` ${styles.ownedCardNew}` : ""}`}
            >
              <div className={styles.ownedCardHead}>
                <span
                  className={styles.ownedSpine}
                  style={{ background: "#5C4767", color: "#D9BE83" }}
                  aria-hidden="true"
                >
                  ✎
                </span>
                <div>
                  <h3>{exam.name}</h3>
                  <p>
                    {exam.questionCount
                      ? `${exam.questionCount} questions`
                      : "Full-length practice exam"}
                  </p>
                </div>
                {isNew ? <span className={styles.newFlag}>New</span> : null}
              </div>
              <ContentRows items={contentForSku(content, exam.sku)} />
            </article>
          );
        })}

        {lockedExams.length > 0 ? (
          <div className={styles.lockedGrid}>
            <p className={styles.lockedHeading}>
              {ownedExams.length > 0
                ? "Not in your library yet"
                : "Available exams"}
            </p>
            {lockedExams.map((exam) => (
              <Link
                key={exam.id}
                href="/mock-exams"
                className={styles.lockedCard}
              >
                <span
                  className={styles.lockedSpine}
                  style={{ background: "#5C4767", color: "#D9BE83" }}
                  aria-hidden="true"
                >
                  ✎
                </span>
                <span>
                  <strong>{exam.name}</strong>
                  <small>
                    {isPurchasable(exam.priceCents)
                      ? "Full-length practice exam"
                      : "Coming soon"}
                  </small>
                </span>
                <span className={styles.unlockAction}>
                  {isPurchasable(exam.priceCents) ? "Unlock" : "Details"}
                </span>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
