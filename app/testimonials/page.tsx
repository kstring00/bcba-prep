import type { Metadata } from "next";
import { BeeMark } from "@/components/BeeMark";
import { TestimonialForm } from "./TestimonialForm";
import styles from "./testimonials.module.css";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://kkajncybxhoylvhhprom.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_zcwo0785jDmjDOnGAq_N8w_-dRm6PaG";

export const metadata: Metadata = {
  title: "Testimonials | BCBA Prep by Bee the Behavior Bae",
  description:
    "Kind words shared by students using BCBA Prep by Bee the Behavior Bae.",
};

export const dynamic = "force-dynamic";

type Testimonial = {
  id: string;
  display_name: string;
  quote: string;
  created_at: string;
};

async function getApprovedTestimonials(): Promise<Testimonial[]> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/testimonials?select=id,display_name,quote,created_at&order=created_at.desc&limit=16`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        cache: "no-store",
      },
    );

    if (!response.ok) return [];
    return (await response.json()) as Testimonial[];
  } catch {
    return [];
  }
}

const noteClasses = [
  styles.noteCream,
  styles.noteLavender,
  styles.noteBlush,
  styles.noteIvory,
  styles.noteLilac,
  styles.noteWarm,
  styles.notePearl,
  styles.noteMauve,
];

const rotations = ["-1.7deg", "0.9deg", "-0.7deg", "1.8deg", "0.8deg", "-1deg", "0.5deg", "-0.9deg"];

export default async function TestimonialsPage() {
  const testimonials = await getApprovedTestimonials();

  return (
    <section className={styles.page}>
      <div className={styles.floralLeft} aria-hidden="true" />
      <div className={styles.floralRight} aria-hidden="true" />

      <div className={styles.shell}>
        <header className={styles.hero}>
          <p className={styles.script}>Kind Words</p>
          <h1>What Students Are Saying</h1>
          <div className={styles.ornament} aria-hidden="true">
            <span />
            <BeeMark size={28} />
            <span />
          </div>
          <p className={styles.intro}>
            Notes shared by students who chose to tell Bee what they loved.
            Every testimonial below is reviewed before it is published.
          </p>
        </header>

        {testimonials.length > 0 ? (
          <div className={styles.wall} aria-label="Approved student testimonials">
            {testimonials.map((testimonial, index) => (
              <article
                className={`${styles.note} ${noteClasses[index % noteClasses.length]}`}
                style={{
                  "--note-rotation": rotations[index % rotations.length],
                } as React.CSSProperties}
                key={testimonial.id}
              >
                <span className={styles.pin} aria-hidden="true" />
                <blockquote>“{testimonial.quote}”</blockquote>
                <p>— {testimonial.display_name}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyWall}>
            <div className={styles.emptyPaper}>
              <span className={styles.pin} aria-hidden="true" />
              <p className={styles.emptyScript}>The wall is ready.</p>
              <h2>Real kind words will live here.</h2>
              <p>
                We are not filling this page with placeholder reviews. When
                students submit their experience and Bee approves it, their note
                will appear here.
              </p>
            </div>
          </div>
        )}

        <div className={styles.closing}>
          <span className={styles.closingLine} aria-hidden="true" />
          <p>
            Every resource is created with <em>care, intention,</em> and a whole
            lot of heart.
          </p>
          <span className={styles.closingLine} aria-hidden="true" />
        </div>

        <section className={styles.submitSection}>
          <div className={styles.submitIntro}>
            <p className={styles.script}>Leave a little note</p>
            <h2>Tell Bee what you loved.</h2>
            <p>
              Share your experience with the site or materials. Your submission
              goes into a private review queue first. Bee decides what gets
              published; your email is never shown publicly.
            </p>
            <div className={styles.reviewSteps}>
              <span>01 · You submit</span>
              <span>02 · Bee reviews</span>
              <span>03 · Approved notes appear here</span>
            </div>
          </div>

          <div className={styles.formCard}>
            <TestimonialForm />
          </div>
        </section>
      </div>
    </section>
  );
}
