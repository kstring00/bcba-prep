import type { Metadata } from "next";
import Link from "next/link";
import { HexCluster, HexDot, HexField } from "@/components/HexMotif";
import { supabaseConfig, supabaseHeaders } from "@/lib/supabase/config";
import { TestimonialForm } from "./TestimonialForm";
import styles from "./testimonials.module.css";

export const metadata: Metadata = {
  title: "Testimonials | BCBA Prep by Bee the Behavior Bae",
  description:
    "What students say about BCBA Prep by Bee the Behavior Bae. Every note is reviewed by Bryana before it appears.",
};

export const dynamic = "force-dynamic";

type Testimonial = {
  id: string;
  display_name: string;
  quote: string;
  created_at: string;
  /** Optional. Null for anyone who submitted while still studying. */
  passed_on: string | null;
};

/*
 * Approved rows only.
 *
 * Submissions are written with status 'pending' by the service role in
 * app/api/testimonials/route.ts and stay invisible until Bryana sets the
 * status to 'approved'. The `status=eq.approved` filter is what makes this
 * page's trust line true.
 *
 * It is not the only thing making it true any more — 0004 revoked anon's
 * INSERT and 0004/0006 restrict SELECT to approved rows at the database — but
 * do not remove the filter on that basis. Two independent limits is the
 * design.
 *
 * An empty array is the right answer for every failure here: the page renders
 * its "be one of the first" state, which is a real design rather than an
 * error. A Supabase outage should not show a broken page.
 */
async function getApprovedTestimonials(): Promise<Testimonial[]> {
  try {
    const { url, publishableKey } = supabaseConfig();
    const response = await fetch(
      `${url}/rest/v1/testimonials` +
        `?select=id,display_name,quote,created_at,passed_on` +
        `&status=eq.approved&order=created_at.desc&limit=16`,
      { headers: supabaseHeaders(publishableKey), cache: "no-store" },
    );

    if (!response.ok) {
      console.error("[testimonials] read failed", response.status);
      return [];
    }
    return (await response.json()) as Testimonial[];
  } catch (error) {
    console.error("[testimonials] read threw", error);
    return [];
  }
}

/**
 * "9.15.26" — the format Bryana uses.
 *
 * Parsed as UTC rather than local: a bare "2026-09-15" is midnight UTC, and
 * formatting that in a timezone behind UTC would render the day before,
 * which on the one line carrying the proof is not a detail.
 *
 * Returns null for anything unparseable so a malformed value renders nothing
 * instead of "Passed Invalid Date".
 */
function formatPassed(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const y = String(date.getUTCFullYear()).slice(2);
  return `${m}.${d}.${y}`;
}

/** First letter of the display name, for the honey cell. */
function initialOf(name: string): string {
  const first = name.trim().charAt(0);
  return first ? first.toUpperCase() : "\u2022";
}

export default async function TestimonialsPage() {
  const testimonials = await getApprovedTestimonials();

  return (
    <section className={styles.page}>
      {/* Warm texture and the honeycomb field, behind everything. */}
      <div className={styles.glowA} aria-hidden="true" />
      <div className={styles.glowB} aria-hidden="true" />
      <div className={styles.hex} aria-hidden="true">
        <HexField size={34} opacity={0.14} />
      </div>

      <div className={`container ${styles.shell}`}>
        <header className={styles.head} data-reveal>
          <p className={styles.eyebrow}>Testimonials</p>
          <h1 className={styles.title}>
            What students <em>say</em>
          </h1>
          <p className={styles.lead}>
            Every note is reviewed by Bryana before it appears.
          </p>
          <HexCluster className={styles.cluster} size={22} honey={1} />
        </header>

        {testimonials.length > 0 ? (
          <ul className={styles.quotes} data-reveal-group>
            {testimonials.map((item) => {
              const passed = formatPassed(item.passed_on);
              return (
                <li className={styles.quote} key={item.id} data-reveal>
                  {/* The writer's initial in a honey cell: the hex frame at
                      its smallest. Decorative; the name follows below. */}
                  <span className={styles.cell} aria-hidden="true">
                    {initialOf(item.display_name)}
                  </span>
                  <blockquote className={styles.quoteText}>
                    {item.quote}&rdquo;
                  </blockquote>
                  <p className={styles.attribution}>
                    <span className={styles.name}>{item.display_name}</span>
                    {/* Only when the date is actually there. */}
                    {passed ? (
                      <span className={styles.passed}>
                        <HexDot size={9} />
                        Passed {passed}
                      </span>
                    ) : null}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles.empty} data-reveal>
            <div className={styles.emptyHex} aria-hidden="true">
              <HexField size={30} opacity={0.08} />
            </div>
            <div className={styles.emptyInner}>
              <HexCluster className={styles.emptyCluster} size={22} honey={1} />
              <h2 className={styles.emptyHeading}>Be one of the first.</h2>
              <p className={styles.emptyBody}>
                No notes here yet — and none will be invented. When someone
                writes one and Bryana approves it, it appears here.
              </p>
            </div>
          </div>
        )}

        <section className={styles.form} id="leave-a-note" data-reveal>
          <div className={styles.formHex} aria-hidden="true">
            <HexField size={26} opacity={0.1} />
          </div>
          <div className={styles.formInner}>
            <h2 className={styles.formTitle}>Leave a note</h2>
            <p className={styles.formLead}>
              If something here helped, telling the next person is the kindest
              thing you can do.
            </p>
            <TestimonialForm />
          </div>
        </section>

        <div className={styles.next} data-reveal>
          <p className={styles.nextText}>
            Not studying with Bryana yet? Join the founding list and
            you&rsquo;ll hear first when the materials open.
          </p>
          <Link href="/start" className="btn--gold">
            Join the founding list <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
