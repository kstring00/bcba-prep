import type { Metadata } from "next";
import Link from "next/link";
import { BeeMark } from "@/components/BeeMark";
import { Florals, Ornament } from "@/components/Florals";
import { AboutCta } from "./AboutCta";
import compact from "./about-compact.module.css";

export const metadata: Metadata = {
  title: "About Bryana | BCBA Prep by Bee the Behavior Bae",
  description:
    "Meet Bryana, founder of Bee the Behavior Bae — six years in ABA with a background in biology and healthcare administration, making BCBA exam prep feel less overwhelming.",
};

/*
  Bryana's own words, used verbatim at her request. Do not rewrite, trim,
  paraphrase, or "tidy" this copy, and keep the emoji — the voice is the brand.
  Section breaks follow her headings.

  The portrait is the one outstanding asset: /public/bryana.jpg does not exist
  yet. See the TODO at the <img> below.
*/
export default function AboutPage() {
  return (
    <>
      {/* ---------- founder hero ---------- */}
      <section className={`about-hero bleed ${compact.hero}`}>
        <Florals variant="hero-left" className="floral floral--hero-left" />
        <Florals variant="hero-right" className="floral floral--hero-right" />

        <div className="bleed-inner founder-grid">
          <div className="founder-copy">
            <p className="script">Meet the Bae behind the bees 🐝💗</p>
            <h1 className="display">
              Hi, I&rsquo;m <span className="accent">Bryana.</span>
            </h1>
            <Ornament />
            <p className="about-lede">
              Founder of Bee the Behavior Bae, and the person who writes every
              study resource on this site.
            </p>

            {/* Credential strip — her verified background, near the top. */}
            <dl className="credential-strip">
              <div>
                <dt>Experience</dt>
                <dd>6 years in ABA</dd>
              </div>
              <div>
                <dt>Background</dt>
                <dd>Biology</dd>
              </div>
              <div>
                <dt>Background</dt>
                <dd>Healthcare administration</dd>
              </div>
            </dl>
          </div>

          <figure className="founder-portrait">
            {/*
              TODO — PHOTO NEEDED.
              Add Bryana's photo at /public/bryana.jpg (portrait crop, at
              least 900px on the short edge) and this slot fills itself.
              Until the file exists the browser shows the alt text inside the
              frame, which is why the frame carries a visible label: an empty
              decorative box would look like a layout bug.
            */}
            <img
              src="/bryana.jpg"
              alt="Bryana, founder of Bee the Behavior Bae"
              width={720}
              height={900}
            />
            <figcaption>
              <strong>Bryana</strong>
              <span>Founder, Bee the Behavior Bae</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ---------- her words ---------- */}
      <section className="founder-story">
        <div className="founder-story-inner">
          <h2 className="display">Meet the Bae Behind the Bees 🐝💗</h2>
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
            behavior and the importance of continued learning and professional
            growth. I understand the dedication it takes to pursue your
            professional goals while balancing the many responsibilities life
            brings.
          </p>
          <p>
            I know that preparing for the BCBA exam can feel like a journey of
            its own. There are concepts to master, scenarios to analyze, and
            moments when you may question whether you&rsquo;re ready.
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
            study guides and key terms to challenging scenario-based questions
            and mock exams, my goal is to help you study with intention and
            recognize where you can continue to grow.
          </p>

          <h2 className="display">✨ Why Bee the Behavior Bae?</h2>
          <p>
            Because your journey deserves more than memorizing definitions. It
            deserves understanding, application, consistency, and confidence.
          </p>
          <p>
            Here, we&rsquo;re not just studying to pass an exam. We&rsquo;re
            building knowledge that can support us as future behavior analysts
            and the people and families we may one day serve.
          </p>
          <p>
            So grab your study materials, trust your preparation, and remember:
            progress happens one concept, one question, and one study session
            at a time.
          </p>
          <p>
            Let&rsquo;s study, grow, and get that PASS, Behavior Bae! 🐝💗
          </p>

          <div className="founder-signoff">
            <span className="signature" aria-hidden="true">
              <BeeMark size={30} />
            </span>
            <p>With love and a little bit of gold,</p>
            <p>Bryana</p>
            <p>Founder, Bee the Behavior Bae</p>
          </div>
        </div>
      </section>

      {/* ---------- one CTA ---------- */}
      <section className="founder-cta">
        <AboutCta />
      </section>
    </>
  );
}
