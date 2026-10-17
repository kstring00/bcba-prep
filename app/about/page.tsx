import type { Metadata } from "next";
import Link from "next/link";
import {
  BookIcon,
  Brain,
  Chart,
  Pencil,
  Trophy,
} from "@/components/Icons";
import { HexCluster, HexDot, HexField, HexFrame } from "@/components/HexMotif";
import { AboutCta } from "./AboutCta";
import { FounderPortrait } from "./FounderPortrait";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About Bryana | BCBA Prep by Bee the Behavior Bae",
  description:
    "Meet Bryana, founder of Bee the Behavior Bae — six years in ABA with a background in biology and healthcare administration, making BCBA exam prep feel less overwhelming.",
};

/*
  Editorial composition on the design system (DESIGN_DIRECTION.md).

  Her copy is used VERBATIM at her request: do not rewrite, trim, paraphrase
  or "tidy" it, and keep the emoji — the voice is the brand. Her section
  headings are her own, and the sign-off sits on three separate lines exactly
  as she wrote it.

  "Meet the Bae Behind the Bees" is the page's H1 and appears exactly once; the
  story opens straight into "Hey, Behavior Bae!" rather than repeating it.

  The five philosophy steps and the premium-resources copy are the existing
  site copy, transcribed from the reference direction the owner supplied.

  The script face is used once on this page — on the signature.
*/
const STEPS = [
  {
    icon: <BookIcon size={22} />,
    name: "Know",
    body: "Focus on high-yield content aligned with the test.",
  },
  {
    icon: <Brain />,
    name: "Understand",
    body: "Learn with visuals, examples, and real-world context.",
  },
  {
    icon: <Pencil />,
    name: "Practice",
    body: "Apply what you learn with targeted practice questions.",
  },
  {
    icon: <Chart />,
    name: "Refine",
    body: "Strengthen weak areas and build exam stamina.",
  },
  {
    icon: <Trophy />,
    name: "Succeed",
    body: "Walk into exam day prepared, calm, and confident.",
  },
];

/*
  Credentials, as supplied in the brief. Nothing here is invented: the
  school is a visible placeholder until Bryana confirms it, styled so it
  cannot be read as a fact. Replace the one `placeholder` cell when she does.
*/
const CREDENTIALS = [
  { value: "6 years", label: "In ABA" },
  { value: "Master’s in ABA", label: "4.0 GPA" },
  { value: "Biology & healthcare administration", label: "Background", long: true },
  { value: null, label: "Education" },
] as const;

export default function AboutPage() {
  return (
    <>
      {/* ---------- 1. editorial: the portrait beside her story ---------- */}
      <section className={styles.hero} data-reveal>
        <div className={styles.heroHex} aria-hidden="true">
          <HexField size={36} opacity={0.14} />
        </div>

        <div className={`container ${styles.heroGrid}`}>
          <div className={styles.text}>
            <p className="eyebrow">Hi, I&rsquo;m Bryana</p>
            <h1 className={styles.title}>Meet the Bae Behind the Bees 🐝💗</h1>
            <p className={styles.lede}>
              Welcome to Bee the Behavior Bae, where we&rsquo;re making BCBA
              exam preparation feel{" "}
              <em>a little less overwhelming and a lot more empowering.</em>
            </p>

            <div className={styles.story}>
              <p className="eyebrow">My Story</p>
              <p>
                Hey, Behavior Bae! Welcome to Bee the Behavior Bae, where
                we&rsquo;re making BCBA exam preparation feel a little less
                overwhelming and a lot more empowering!
              </p>
              <p>
                My name is Bryana, and I created Bee the Behavior Bae out of my
                passion for learning, growth, and the field of Applied Behavior
                Analysis (ABA). With six years of experience in the ABA field,
                along with a background in biology and healthcare
                administration, I&rsquo;ve developed a deep appreciation for the
                science of behavior and the importance of continued learning
                and professional growth. I understand the dedication it takes
                to pursue your professional goals while balancing the many
                responsibilities life brings.
              </p>
              <p>
                I know that preparing for the BCBA exam can feel like a journey
                of its own. There are concepts to master, scenarios to analyze,
                and moments when you may question whether you&rsquo;re ready.
                That&rsquo;s why I want Bee the Behavior Bae to be a place where
                aspiring BCBAs can find helpful study resources, strengthen
                their understanding, and approach exam preparation with greater
                confidence.
              </p>
            </div>
          </div>

          <figure className={styles.media}>
            {/* The motif's primary use: her portrait in the hex frame. */}
            <HexFrame offset={14}>
              <FounderPortrait />
            </HexFrame>
          </figure>
        </div>
      </section>

      {/* ---------- 2. credentials: a stat row ---------- */}
      <section className={styles.creds} aria-label="Credentials" data-reveal>
        <ul className={`container ${styles.credsRow}`}>
          {CREDENTIALS.map((c) => (
            <li className={styles.cred} key={c.label}>
              {c.value ? (
                <span
                  className={`${styles.credValue}${"long" in c && c.long ? ` ${styles.credValueLong}` : ""}`}
                >
                  {c.value}
                </span>
              ) : (
                /* TODO — CONFIRM WITH BRYANA: the awarding university. */
                <span className={styles.credValue}>
                  <span className={styles.placeholder}>
                    [University – confirm with Bryana]
                  </span>
                </span>
              )}
              <span className={styles.credLabel}>{c.label}</span>
              <HexDot size={10} className={styles.credDot} />
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- 3. mission: the gold band ---------- */}
      <section className={styles.mission} data-reveal>
        <div className={styles.missionHex} aria-hidden="true">
          <HexField size={40} opacity={0.07} />
        </div>
        <div className={`container ${styles.missionInner}`}>
          <p className={styles.missionEyebrow}>Bee the Behavior Bae</p>
          <h2 className={styles.missionTitle}>🩷 My Mission</h2>
          <p className={styles.missionBody}>
            My mission is to create study resources that make learning ABA
            concepts more approachable, encourage critical thinking, and help
            future behavior analysts practice applying what they know. From
            study guides and key terms to challenging scenario-based questions
            and mock exams, my goal is to help you study with intention and
            recognize where you can continue to grow.
          </p>
        </div>
      </section>

      {/* ---------- 4. why: split, with the cluster ---------- */}
      <section className={styles.why} data-reveal>
        <div className={`container ${styles.whyGrid}`}>
          <div className={styles.whyHead}>
            <HexCluster className={styles.cluster} size={20} honey={1} />
            <h2 className={styles.whyTitle}>✨ Why Bee the Behavior Bae?</h2>
          </div>

          <div className={styles.whyBody}>
            <p>
              Because your journey deserves more than memorizing definitions.
              It deserves understanding, application, consistency, and
              confidence.
            </p>
            <p>
              Here, we&rsquo;re not just studying to pass an exam. We&rsquo;re
              building knowledge that can support us as future behavior
              analysts and the people and families we may one day serve.
            </p>
            <p>
              So grab your study materials, trust your preparation, and
              remember: progress happens one concept, one question, and one
              study session at a time.
            </p>
            <p>Let&rsquo;s study, grow, and get that PASS, Behavior Bae! 🐝💗</p>

            {/* Three separate lines, as written. */}
            <div className={styles.signoff}>
              <p>With love and a little bit of gold,</p>
              <p className={styles.signature}>Bryana</p>
              <p className={styles.signoffRole}>Founder, Bee the Behavior Bae</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 5. philosophy: night band, five steps ---------- */}
      <section className={styles.philosophy} data-reveal>
        <div className={styles.philHex} aria-hidden="true">
          <HexField size={40} opacity={0.06} />
        </div>
        <div className={`container ${styles.philInner}`}>
          <div className={styles.philHead}>
            <p className={styles.philEyebrow}>My Teaching Philosophy</p>
            <h2 className={styles.philTitle}>
              You Don&rsquo;t Need More Hours. You Need a Better System.
            </h2>
          </div>

          <ol className={styles.steps} data-reveal-group>
            {STEPS.map((step, i) => (
              <li className={styles.step} key={step.name} data-reveal>
                <div className={styles.stepTop}>
                  <span aria-hidden="true">{step.icon}</span>
                  <span className={styles.stepN} aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>
                <p className={styles.stepName}>{step.name}</p>
                <p className={styles.stepBody}>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- 6. premium resources: split ---------- */}
      <section className={styles.resources} data-reveal>
        <div className={`container ${styles.resGrid}`}>
          <h2 className={styles.resTitle}>
            Premium Resources. <em>Built the Hard Way.</em>
          </h2>
          <div className={styles.resBody}>
            {/*
              The second paragraph used to say there were "no separate
              mock-exam, study-guide, or coaching products". Mock Exams is now
              its own product line, so that sentence contradicted the
              storefront and was removed rather than reworded around.
            */}
            <p>
              These materials were not assembled overnight. They are the fruit
              of long hours spent studying, organizing, writing, revising, and
              designing until the information felt clear, useful, and worth
              studying from.
            </p>
            <p>
              Choose the domain you need, and your purchase gives you access to
              the materials Bee created for that domain&mdash;kept together as
              one focused body of work.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- 7. closing: centred and balanced ---------- */}
      <section className={styles.closing} data-reveal>
        <div className={styles.closingHex} aria-hidden="true">
          <HexField size={34} opacity={0.12} />
        </div>
        <div className={`container ${styles.closingInner}`}>
          <h2 className={styles.closingTitle}>Ready to Choose Your Next Domain?</h2>
          <p className={styles.closingSub}>
            Start with the part of the exam you&rsquo;re ready to work on next.
          </p>
          <div className={styles.closingActions}>
            {/* Pre-launch: the founding list is the gold action; the library
                link keeps its place in the quiet voice. */}
            <Link href="/start" className="btn--gold">
              Join the founding list <span aria-hidden="true">→</span>
            </Link>
            <AboutCta quiet />
          </div>
        </div>
      </section>
    </>
  );
}
