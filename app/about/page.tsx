"use client";

import Link from "next/link";
import { useState } from "react";
import { Florals, Ornament } from "@/components/Florals";
import {
  ArrowRight,
  Bag,
  BookIcon,
  Brain,
  Chart,
  Envelope,
  Globe,
  Pencil,
  People,
  Sparkle,
  Tablet,
  Target,
  Trophy,
} from "@/components/Icons";

/*
  Section headings, card blurbs and the five philosophy steps are transcribed
  from the reference design the owner supplied.

  Everything that is a CHECKABLE CLAIM about the business or a person is a
  [[TODO_]] token instead — the four stat figures, the personal story, and
  the testimonials. Those are Bryana's to write; inventing a number or
  putting words in a named reviewer's mouth is not a design decision.
*/

const STATS = [
  { icon: <Sparkle />, value: "[[TODO_STAT_YEARS]]", label: "Years in ABA" },
  {
    icon: <People />,
    value: "[[TODO_STAT_STUDENTS]]",
    label: "Students Helped",
  },
  {
    icon: <BookIcon />,
    value: "[[TODO_STAT_RESOURCES]]",
    label: "Study Resources",
  },
  {
    icon: <Target />,
    value: "[[TODO_STAT_FRAMEWORK]]",
    label: "Pass-Focused Framework",
  },
];

const CARDS = [
  {
    icon: <Bag />,
    title: "Mock Exams",
    body: "Realistic, high-quality practice exams that mirror the actual BCBA® test experience.",
    cta: "Explore mocks",
    href: "/mock-exams",
    thumb: "[[TODO_IMAGE_MOCK_EXAMS]]",
  },
  {
    icon: <Tablet />,
    title: "Visual Study Guides",
    body: "Concise, beautifully designed notes that make complex topics easy to understand.",
    cta: "View study guides",
    href: "/study-guides",
    thumb: "[[TODO_IMAGE_STUDY_GUIDES]]",
  },
  {
    icon: <Globe />,
    title: "Coaching & Resources",
    body: "Personalized guidance, study plans, and support to keep you on track and confident.",
    cta: "Learn more",
    href: "/resources",
    thumb: "[[TODO_IMAGE_COACHING]]",
  },
];

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

const TESTIMONIALS = [
  "[[TODO_TESTIMONIAL_1]]",
  "[[TODO_TESTIMONIAL_2]]",
  "[[TODO_TESTIMONIAL_3]]",
];

const ATTRIBUTIONS = [
  "[[TODO_TESTIMONIAL_1_NAME]]",
  "[[TODO_TESTIMONIAL_2_NAME]]",
  "[[TODO_TESTIMONIAL_3_NAME]]",
];

export default function AboutPage() {
  const [quote, setQuote] = useState(0);

  return (
    <>
      {/* ---------- hero ---------- */}
      <section className="about-hero bleed">
        <Florals variant="hero-left" className="floral floral--hero-left" />
        <Florals variant="hero-right" className="floral floral--hero-right" />

        <div className="bleed-inner about-hero-grid">
          <div>
            <p className="script">Hi, I&rsquo;m Bryana</p>
            <h1 className="display">
              Your BCBA Prep
              <br />
              Mentor &amp; Guide
            </h1>
            <Ornament />
            <p className="about-lede">
              I created BCBA Prep by Bryana to help future BCBAs{" "}
              <span className="accent">
                study smarter, feel prepared, and pass with confidence.
              </span>{" "}
              Everything here is built from real exam expectations&mdash;so you
              can focus on what truly matters.
            </p>
          </div>

          <div className="portrait">
            <div className="portrait-inner">[[TODO_PORTRAIT_BRYANA]]</div>
          </div>
        </div>
      </section>

      {/* ---------- stats ---------- */}
      <section className="stats" aria-label="At a glance">
        <div className="stats-inner">
          {STATS.map((s) => (
            <div className="stat" key={s.label}>
              {s.icon}
              <div>
                <div
                  className={`stat-num${s.value.startsWith("[[") ? " stat-num--todo" : ""}`}
                >
                  {s.value}
                </div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- resources ---------- */}
      <section className="resources bleed">
        <Florals
          variant="corner-right"
          className="floral floral--corner-right"
        />
        <div className="bleed-inner">
          <div className="section-head">
            <Ornament />
            <h2 className="display">
              Premium Resources. <span className="accent">Proven Results.</span>
            </h2>
            <Ornament />
          </div>
          <p className="section-sub">
            High-yield tools and coaching designed to help you master the BACB
            <sup>&reg;</sup> exam.
          </p>

          <div className="cards">
            {CARDS.map((c) => (
              <article className="card" key={c.title}>
                <span className="card-badge">{c.icon}</span>
                <div className="card-thumb">{c.thumb}</div>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                  <Link href={c.href} className="link-arrow">
                    {c.cta} <ArrowRight />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- story + philosophy ---------- */}
      <section className="split">
        <div className="story">
          <div>
            <p className="script script--gold">My Story</p>
            <h2 className="display">
              Why I Built
              <br />
              BCBA Prep by Bryana
            </h2>
            <p>[[TODO_STORY_PARAGRAPH_1]]</p>
            <p>[[TODO_STORY_PARAGRAPH_2]]</p>
            <p className="signature" aria-hidden="true">
              Bryana
            </p>
          </div>
          <div className="story-art">
            <div className="story-art-inner">[[TODO_IMAGE_STUDIO]]</div>
          </div>
        </div>

        <div className="philosophy bleed">
          <Florals variant="band-right" className="floral floral--band-right" />
          <div style={{ position: "relative", zIndex: 2 }}>
            <p className="script">My Teaching Philosophy</p>
            <h2 className="display">
              You Don&rsquo;t Need More Hours.
              <br />
              You Need a Better System.
            </h2>

            <ol className="steps">
              {STEPS.map((s, i) => (
                <li className="step" key={s.name}>
                  <span className="step-icon">{s.icon}</span>
                  <div className="step-n">{i + 1}</div>
                  <p className="step-name">{s.name}</p>
                  <p>{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- testimonial + CTA ---------- */}
      <section className="closing bleed">
        <Florals
          variant="corner-right"
          className="floral floral--corner-right"
        />
        <div className="closing-inner">
          <figure className="quote">
            <span className="quote-mark" aria-hidden="true">
              &ldquo;
            </span>
            <div>
              <p>{TESTIMONIALS[quote]}</p>
              <cite>&mdash; {ATTRIBUTIONS[quote]}</cite>
              <div className="dots" role="tablist" aria-label="Testimonials">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    className="dot"
                    aria-current={i === quote}
                    aria-label={`Testimonial ${i + 1}`}
                    onClick={() => setQuote(i)}
                  />
                ))}
              </div>
            </div>
          </figure>

          <div className="closing-rule" aria-hidden="true" />

          <div className="cta">
            <span className="cta-icon" aria-hidden="true">
              <Envelope />
            </span>
            <div>
              <h2 className="display">Ready to Start Your Journey?</h2>
              <p>
                Let&rsquo;s build your path to becoming a BCBA&mdash;together.
              </p>
              <Link href="/" className="btn btn--solid">
                Explore resources <ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
