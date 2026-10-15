import type { ReactNode } from "react";
import type { ContentItem } from "@/lib/entitlements/library";
import styles from "./member.module.css";

/**
 * Shared layout for a single owned item's page. Used by both the domain and
 * the exam deep links so they cannot drift apart.
 */
export function ContentPanel({
  eyebrow,
  title,
  meta,
  tone,
  foil,
  spineLabel,
  items,
  footer,
}: {
  eyebrow: string;
  title: string;
  meta: string;
  tone: string;
  foil: string;
  spineLabel: string;
  items: ContentItem[];
  footer: ReactNode;
}) {
  return (
    <section className={styles.page}>
      <div className={`${styles.shell}`}>
        <article className={styles.ownedCard} style={{ marginTop: 32 }}>
          <div className={styles.ownedCardHead}>
            <span
              className={styles.ownedSpine}
              style={{ background: tone, color: foil }}
              aria-hidden="true"
            >
              {spineLabel}
            </span>
            <div>
              <p className={styles.itemEyebrow}>{eyebrow}</p>
              <h1>{title}</h1>
              <p>{meta}</p>
            </div>
          </div>

          {items.length === 0 ? (
            <p className={styles.libraryEmptyNote}>
              Bee is still loading the files for this one. They will appear
              here as soon as they are published — there is nothing more for
              you to buy.
            </p>
          ) : (
            <ul className={styles.contentList}>
              {items.map((item) => (
                <li key={item.id}>
                  {item.kind === "file" ? (
                    <a
                      href={`/api/content/${item.id}`}
                      className={styles.contentLink}
                      rel="nofollow"
                    >
                      <span className={styles.contentIcon} aria-hidden="true">
                        ▤
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        {item.description ? (
                          <small>{item.description}</small>
                        ) : null}
                        {item.page_count ? (
                          <small>{item.page_count} pages</small>
                        ) : null}
                      </span>
                      <span className={styles.contentAction} aria-hidden="true">
                        Download
                      </span>
                    </a>
                  ) : (
                    <div
                      className={`${styles.contentLink} ${styles.contentPending}`}
                    >
                      <span className={styles.contentIcon} aria-hidden="true">
                        ◷
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>
                          Interactive version is being built. Your access is
                          already recorded.
                        </small>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 26 }}>{footer}</div>
        </article>
      </div>
    </section>
  );
}
