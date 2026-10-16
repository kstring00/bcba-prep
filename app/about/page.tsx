import type { Metadata } from "next";
import Link from "next/link";
import { Florals, Ornament } from "@/components/Florals";
import {
  ArrowRight,
  BookIcon,
  Brain,
  Chart,
  Pencil,
  Trophy,
} from "@/components/Icons";
import { AboutCta } from "./AboutCta";
import { FounderPortrait } from "./FounderPortrait";

export const metadata: Metadata = {
  title: "About Bryana | BCBA Prep by Bee the Behavior Bae",
  description:
    "Meet Bryana, founder of Bee the Behavior Bae — six years in ABA with a background in biology and healthcare administration, making BCBA exam prep feel less overwhelming.",
};

/*
  The original compact editorial layout, with Bryana's content in it.

  Her copy is used VERBATIM at her request: do not rewrite, trim, paraphrase
  or "tidy" it, and keep the emoji — the voice is the brand. Her section
  headings are her own, and the sign-off sits on three separate lines exactly
  as she wrote it.

  "Meet the Bae Behind the Bees" is the page's H1 and appears exactly once; the
  story section opens straight into "Hey, Behavior Bae!" rather than repeating
  it.

  The five philosophy steps and the premium-resources copy are the existing
  site copy, transcribed from the reference direction the owner supplied.
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

export default function AboutPage() {
  return (
    <>
      {/* ---------- compact hero ---------- */}
      <section className="about-hero">
        <Florals variant="hero-left" className="floral floral--hero-left" />
        <Florals variant="hero-right" className="floral floral--hero-right" />

        <div className="about-hero-grid col-section">
          <div className="about-hero-copy">
            <p className="script">Hi, I&rsquo;m Bryana</p>
            <h1 className="display">Meet the Bae Behind the Bees 🐝💗</h1>
            <Ornament />
            <p className="about-lede">
              Welcome to Bee the Behavior Bae, where we&rsquo;re making BCBA
              exam preparation feel{" "}
              <span className="accent">
                a little less overwhelming and a lot more empowering.
              </span>
            </p>
          </div>

          <figure className="about-portrait">
            <FounderPortrait />
          </figure>
        </div>
      </section>

      {/* ---------- credentials ---------- */}
      {/* Replaces the old four-figure stats band. Two cells, both verifiable,
          both supplied by Bryana — no invented numbers. */}
      <section className="credentials" aria-label="Credentials">
        <dl className="credentials-inner col-section">
          {/*
            TODO — CONFIRM WITH BRYANA.
            Exact degree name and the awarding school. Shown as written here
            until she confirms; if the degree title differs, correct this one
            line rather than inventing an abbreviation.
          */}
          <div className="credential">
            <dt>Education</dt>
            <dd>M.S. in Applied Behavior Analysis</dd>
          </div>
          <div className="credential">
            <dt>Experience</dt>
            <dd>6 years in ABA</dd>
          </div>
          <div className="credential">
            <dt>Background</dt>
            <dd>Biology &amp; Healthcare Administration</dd>
          </div>
        </dl>
      </section>

      {/* ---------- story + philosophy ---------- */}
      {/* Single centered reading column on light ground. The old split put
          this beside the philosophy band, which left one tall dark panel
          against a short light one. */}
      <section className="about-story band">
        <div className="col-text">
          <p className="script">My Story</p>

            <p>
              Hey, Behavior Bae! Welcome to Bee the Behavior Bae, where
              we&rsquo;re making BCBA exam preparation feel a little less
              overwhelming and a lot more empowering!
            </p>
            <p>
              My name is Bryana, and I created Bee the Behavior Bae out of my
              passion for learning, growth, and the field of Applied Behavior
              Analysis (ABA). With six years of experience in the ABA field,
              along with a background in biology and healthcare administration,
              I&rsquo;ve developed a deep appreciation for the science of
              behavior and the importance of continued learning and
              professional growth. I understand the dedication it takes to
              pursue your professional goals while balancing the many
              responsibilities life brings.
            </p>
            <p>
              I know that preparing for the BCBA exam can feel like a journey
              of its own. There are concepts to master, scenarios to analyze,
              and moments when you may question whether you&rsquo;re ready.
              That&rsquo;s why I want Bee the Behavior Bae to be a place where
              aspiring BCBAs can find helpful study resources, strengthen their
              understanding, and approach exam preparation with greater
              confidence.
            </p>

            <h2 className="display">🩷 My Mission</h2>
            <p>
              My mission is to create study resources that make learning ABA
              concepts more approachable, encourage critical thinking, and help
              future behavior analysts practice applying what they know. From
              study guides and key terms to challenging scenario-based
              questions and mock exams, my goal is to help you study with
              intention and recognize where you can continue to grow.
            </p>

            <h2 className="display">✨ Why Bee the Behavior Bae?</h2>
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
          <div className="signoff">
            <p>With love and a little bit of gold,</p>
            <p className="signature">Bryana</p>
            <p className="signoff-role">Founder, Bee the Behavior Bae</p>
          </div>
        </div>
      </section>

      {/* ---------- philosophy: its own full-width band ---------- */}
      <section className="philosophy-band band">
        <Florals variant="band-right" className="floral floral--band-right" />
        <div className="col-section philosophy-inner">
          <p className="script">My Teaching Philosophy</p>
          <h2 className="display">
            You Don&rsquo;t Need More Hours. You Need a Better System.
          </h2>

          <ol className="steps-row">
            {STEPS.map((step, i) => (
              <li className="step-cell" key={step.name}>
                <span className="step-icon">{step.icon}</span>
                <span className="step-n">{i + 1}</span>
                <p className="step-name">{step.name}</p>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- premium resources ---------- */}
      <section className="about-resources band">
        <div className="col-text">
          <div className="section-head">
            <Ornament />
            <h2 className="display">
              Premium Resources. <span className="accent">Built the Hard Way.</span>
            </h2>
            <Ornament />
          </div>

          {/*
            The second paragraph used to say there were "no separate mock-exam,
            study-guide, or coaching products". Mock Exams is now its own
            product line, so that sentence contradicted the storefront and has
            been removed rather than reworded around.
          */}
          <p className="section-sub">
            These materials were not assembled overnight. They are the fruit of
            long hours spent studying, organizing, writing, revising, and
            designing until the information felt clear, useful, and worth
            studying from.
          </p>
          <p className="section-sub">
            Choose the domain you need, and your purchase gives you access to
            the materials Bee created for that domain&mdash;kept together as
            one focused body of work.
          </p>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="about-closing band">
        <div className="col-text about-closing-inner">
          <h2 className="display">Ready to Choose Your Next Domain?</h2>
          <p>Start with the part of the exam you&rsquo;re ready to work on next.</p>
          <AboutCta />
        </div>
      </section>
    </>
  );
}
