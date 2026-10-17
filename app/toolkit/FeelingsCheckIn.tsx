"use client";

import { useEffect, useState } from "react";
import { HexDot } from "@/components/HexMotif";
import {
  CRISIS_LINE,
  DEVICE_KEY,
  SAFETY_NOTE,
  TAPPED_KEY,
  isFeelingSlug,
  type FeelingSlug,
} from "@/lib/toolkit/config";
import { CARE_PLANS, FEELINGS_IN_ORDER } from "@/lib/toolkit/feelings";
import type { FeelingCounts } from "@/lib/toolkit/counts";
import styles from "./toolkit.module.css";

/**
 * "How are you feeling?" — six taps, each opening a care plan in place.
 *
 * No free text, no name, no login. The only thing that leaves the browser
 * is the slug that was tapped plus a random id this browser made up for
 * itself, once per UTC day, so the page can show honest counts. The care
 * plan opens whether or not that request succeeds.
 *
 * Deep link: /toolkit#overwhelmed opens that plan on arrival.
 */
function utcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

function deviceId(): string | null {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    localStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
}

function recordTap(feeling: FeelingSlug) {
  const device = deviceId();
  if (!device) return;
  // One tap per device per day: the server enforces it; this just avoids
  // the request when nothing would change.
  try {
    const last = localStorage.getItem(TAPPED_KEY);
    if (last === `${utcDay()}:${feeling}`) return;
    localStorage.setItem(TAPPED_KEY, `${utcDay()}:${feeling}`);
  } catch {
    /* storage unavailable: still send once */
  }
  void fetch("/api/toolkit/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ feeling, device }),
    keepalive: true,
  }).catch(() => {
    /* a tap that did not record changes nothing for the person */
  });
}

export function FeelingsCheckIn({ counts }: { counts: FeelingCounts }) {
  const [selected, setSelected] = useState<FeelingSlug | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (isFeelingSlug(hash)) setSelected(hash);
  }, []);

  function choose(slug: FeelingSlug) {
    setSelected(slug);
    recordTap(slug);
    try {
      history.replaceState(null, "", `#${slug}`);
    } catch {
      /* ignore */
    }
    // Bring the plan into view on phones, where it renders below the taps.
    requestAnimationFrame(() => {
      const el = document.getElementById("care-plan");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Keyboard and screen-reader users land on the plan, not back on the
      // row of taps.
      el?.focus({ preventScroll: true });
    });
  }

  const plan = selected ? CARE_PLANS[selected] : null;

  return (
    <div className={styles.checkin}>
      <div className={styles.taps} role="radiogroup" aria-label="How are you feeling?">
        {FEELINGS_IN_ORDER.map((f) => {
          const on = selected === f.slug;
          const n = counts[f.slug];
          return (
            <button
              key={f.slug}
              type="button"
              className={`${styles.tap}${on ? ` ${styles.tapOn}` : ""}`}
              role="radio"
              aria-checked={on}
              onClick={() => choose(f.slug)}
            >
              <span className={styles.tapCell} aria-hidden="true">
                <HexDot size={14} />
              </span>
              <span className={styles.tapLabel}>{f.label}</span>
              <span className={styles.tapHint}>{f.hint}</span>
              {n ? (
                <span className={styles.tapCount}>
                  {n} {n === 1 ? "person" : "people"} this week
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {plan ? (
        <article
          className={styles.plan}
          id="care-plan"
          aria-labelledby="care-plan-title"
          tabIndex={-1}
          key={plan.slug}
        >
          <header className={styles.planHead}>
            <p className="eyebrow">A small care plan</p>
            <h3 className={styles.planTitle} id="care-plan-title">
              {plan.label}
            </h3>
            {plan.encouragement.map((line) => (
              <p className={styles.planLede} key={line}>
                {line}
              </p>
            ))}
          </header>

          <div className={styles.planGrid}>
            <section className={styles.planBlock}>
              <h4 className={styles.planBlockTitle}>{plan.reset.title}</h4>
              <ol className={styles.steps}>
                {plan.reset.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>

            <section className={styles.planBlock}>
              <h4 className={styles.planBlockTitle}>What to say to your supervisor</h4>
              <p className={styles.planText}>{plan.supervisor.intro}</p>
              <blockquote className={styles.say}>{plan.supervisor.say}</blockquote>
            </section>

            <section className={`${styles.planBlock} ${styles.planBlockWide}`}>
              <h4 className={styles.planBlockTitle}>If you want more than two minutes</h4>
              <ul className={styles.resources}>
                {plan.resources.map((r) => (
                  <li key={r.label}>
                    {r.href ? (
                      <a href={r.href} target="_blank" rel="noopener noreferrer">
                        {r.label}
                      </a>
                    ) : (
                      <strong>{r.label}</strong>
                    )}
                    <span>{r.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* The rule, restated where the plan ends. */}
          <p className={styles.planSafety}>
            <strong>{SAFETY_NOTE}</strong> {CRISIS_LINE}
          </p>
        </article>
      ) : null}
    </div>
  );
}
