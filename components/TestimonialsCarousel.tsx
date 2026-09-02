"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

export type TestimonialItem = {
  id?: string;
  quote: string;
  name: string;
  credential?: string | null;
};

type Props = {
  items: TestimonialItem[];
  eyebrow?: string;
  title?: string;
};

export function TestimonialsCarousel({
  items,
  eyebrow = "Kind words",
  title = "What future BCBAs are saying",
}: Props) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = items.length;

  const move = useCallback(
    (direction: 1 | -1) => {
      if (count < 2) return;
      setActive((current) => (current + direction + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (reduceMotion || paused || count < 2) return;
    const timer = window.setInterval(() => move(1), 6500);
    return () => window.clearInterval(timer);
  }, [count, move, paused, reduceMotion]);

  if (count === 0) return null;

  const item = items[active];

  return (
    <section
      className="testimonial-carousel"
      aria-roledescription="carousel"
      aria-label="Testimonials"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="testimonial-wash testimonial-wash--left" aria-hidden="true" />
      <div className="testimonial-wash testimonial-wash--right" aria-hidden="true" />

      <div className="testimonial-shell">
        <header className="testimonial-heading">
          <p className="testimonial-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <span className="testimonial-rule" aria-hidden="true">
            <i />
            <b>✦</b>
            <i />
          </span>
        </header>

        <div className="testimonial-stage">
          <button
            className="testimonial-arrow testimonial-arrow--left"
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous testimonial"
            disabled={count < 2}
          >
            <span aria-hidden="true">←</span>
          </button>

          <div className="testimonial-card-wrap" aria-live="polite">
            <span className="testimonial-ghost testimonial-ghost--left" aria-hidden="true" />
            <span className="testimonial-ghost testimonial-ghost--right" aria-hidden="true" />

            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={item.id ?? `${item.name}-${active}`}
                className="testimonial-card"
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, y: 16, scale: 0.985 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -10, scale: 0.99 }
                }
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { duration: 0.42, ease: [0.22, 0.61, 0.36, 1] }
                }
              >
                <span className="testimonial-kicker" aria-hidden="true">
                  “
                </span>
                <blockquote>{item.quote}</blockquote>
                <figcaption>
                  <span className="testimonial-avatar" aria-hidden="true">
                    {initials(item.name)}
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    {item.credential ? <small>{item.credential}</small> : null}
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          <button
            className="testimonial-arrow testimonial-arrow--right"
            type="button"
            onClick={() => move(1)}
            aria-label="Next testimonial"
            disabled={count < 2}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {count > 1 ? (
          <div className="testimonial-dots" aria-label="Choose testimonial">
            {items.map((testimonial, index) => (
              <button
                key={testimonial.id ?? `${testimonial.name}-${index}`}
                type="button"
                className={index === active ? "is-active" : undefined}
                aria-label={`Show testimonial ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => setActive(index)}
              />
            ))}
          </div>
        ) : null}
      </div>

      <style jsx>{`
        .testimonial-carousel {
          --tc-ink: #2b2429;
          --tc-muted: #6f626a;
          --tc-violet: #5a4763;
          --tc-rose: #b7778c;
          --tc-gold: #b99a62;
          --tc-cream: #f8f3ec;
          --tc-paper: #fffdf9;
          position: relative;
          overflow: hidden;
          padding: clamp(72px, 10vw, 132px) 22px;
          background:
            radial-gradient(circle at 50% 42%, rgba(183,119,140,.09), transparent 36%),
            linear-gradient(180deg, #fbf7f1 0%, var(--tc-cream) 100%);
          color: var(--tc-ink);
          isolation: isolate;
        }

        .testimonial-shell {
          position: relative;
          z-index: 2;
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .testimonial-heading {
          width: min(760px, 100%);
          margin: 0 auto clamp(34px, 5vw, 58px);
          text-align: center;
        }

        .testimonial-eyebrow {
          margin: 0 0 9px;
          font-family: var(--font-script), cursive;
          font-size: clamp(25px, 4vw, 37px);
          line-height: 1;
          color: var(--tc-rose);
        }

        .testimonial-heading h2 {
          margin: 0;
          font-family: var(--font-display), Georgia, serif;
          font-weight: 500;
          font-size: clamp(38px, 6vw, 67px);
          line-height: .98;
          letter-spacing: -.035em;
        }

        .testimonial-rule {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: min(280px, 70%);
          margin: 24px auto 0;
          color: var(--tc-gold);
        }

        .testimonial-rule i {
          height: 1px;
          flex: 1;
          background: linear-gradient(90deg, transparent, currentColor);
        }

        .testimonial-rule i:last-child {
          background: linear-gradient(90deg, currentColor, transparent);
        }

        .testimonial-rule b {
          font-size: 12px;
          font-weight: 400;
        }

        .testimonial-stage {
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr) 52px;
          align-items: center;
          gap: clamp(8px, 2vw, 24px);
        }

        .testimonial-card-wrap {
          position: relative;
          min-height: 330px;
          display: grid;
          place-items: center;
          perspective: 900px;
        }

        .testimonial-ghost {
          position: absolute;
          z-index: -1;
          top: 28px;
          width: 42%;
          height: calc(100% - 56px);
          border: 1px solid rgba(185,154,98,.27);
          border-radius: 3px;
          background: rgba(255,253,249,.55);
          box-shadow: 0 20px 60px rgba(52,39,47,.05);
        }

        .testimonial-ghost--left {
          left: -18px;
          transform: rotate(-2.2deg) translateX(-3%);
        }

        .testimonial-ghost--right {
          right: -18px;
          transform: rotate(2.2deg) translateX(3%);
        }

        .testimonial-card {
          position: relative;
          width: min(760px, 100%);
          min-height: 330px;
          margin: 0;
          padding: clamp(42px, 7vw, 72px) clamp(30px, 7vw, 78px) 38px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          border: 1px solid rgba(185,154,98,.48);
          border-radius: 3px;
          background:
            linear-gradient(135deg, rgba(255,255,255,.7), transparent 42%),
            var(--tc-paper);
          box-shadow:
            0 28px 80px rgba(58,43,52,.10),
            0 2px 8px rgba(58,43,52,.05);
        }

        .testimonial-card::before,
        .testimonial-card::after {
          content: "";
          position: absolute;
          width: 68px;
          height: 68px;
          pointer-events: none;
          opacity: .65;
        }

        .testimonial-card::before {
          top: 15px;
          left: 15px;
          border-top: 1px solid var(--tc-gold);
          border-left: 1px solid var(--tc-gold);
        }

        .testimonial-card::after {
          right: 15px;
          bottom: 15px;
          border-right: 1px solid var(--tc-gold);
          border-bottom: 1px solid var(--tc-gold);
        }

        .testimonial-kicker {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          font-family: var(--font-display), Georgia, serif;
          font-size: 78px;
          line-height: 1;
          color: rgba(183,119,140,.27);
        }

        blockquote {
          margin: 0;
          text-align: center;
          font-family: var(--font-display), Georgia, serif;
          font-size: clamp(25px, 3.25vw, 39px);
          font-weight: 400;
          line-height: 1.22;
          letter-spacing: -.018em;
          text-wrap: balance;
        }

        figcaption {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          margin-top: 30px;
          color: var(--tc-muted);
          font-family: var(--font-sans), sans-serif;
        }

        figcaption > span:last-child {
          display: grid;
          gap: 2px;
          text-align: left;
        }

        figcaption strong {
          color: var(--tc-violet);
          font-size: 13px;
          letter-spacing: .08em;
          text-transform: uppercase;
        }

        figcaption small {
          font-size: 12px;
          letter-spacing: .025em;
        }

        .testimonial-avatar {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(185,154,98,.56);
          border-radius: 50%;
          background: linear-gradient(145deg, #eee4eb, #f6ece5);
          color: var(--tc-violet);
          font-family: var(--font-display), Georgia, serif;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: .04em;
        }

        .testimonial-arrow {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(90,71,99,.25);
          border-radius: 50%;
          background: rgba(255,253,249,.72);
          color: var(--tc-violet);
          cursor: pointer;
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
          backdrop-filter: blur(8px);
        }

        .testimonial-arrow:hover:not(:disabled),
        .testimonial-arrow:focus-visible:not(:disabled) {
          transform: translateY(-2px);
          border-color: var(--tc-gold);
          background: var(--tc-paper);
        }

        .testimonial-arrow:focus-visible,
        .testimonial-dots button:focus-visible {
          outline: 2px solid var(--tc-violet);
          outline-offset: 3px;
        }

        .testimonial-arrow:disabled {
          opacity: .25;
          cursor: default;
        }

        .testimonial-dots {
          display: flex;
          justify-content: center;
          gap: 9px;
          margin-top: 28px;
        }

        .testimonial-dots button {
          width: 24px;
          height: 4px;
          padding: 0;
          border: 0;
          border-radius: 99px;
          background: rgba(90,71,99,.2);
          cursor: pointer;
          transition: width .25s ease, background .25s ease;
        }

        .testimonial-dots button.is-active {
          width: 48px;
          background: linear-gradient(90deg, var(--tc-rose), var(--tc-violet));
        }

        .testimonial-wash {
          position: absolute;
          z-index: 0;
          width: 410px;
          height: 410px;
          border-radius: 50%;
          filter: blur(2px);
          opacity: .26;
          pointer-events: none;
        }

        .testimonial-wash--left {
          left: -260px;
          top: -80px;
          background: radial-gradient(circle, rgba(183,119,140,.28), transparent 68%);
        }

        .testimonial-wash--right {
          right: -250px;
          bottom: -180px;
          background: radial-gradient(circle, rgba(90,71,99,.24), transparent 68%);
        }

        @media (max-width: 700px) {
          .testimonial-carousel {
            padding-inline: 14px;
          }

          .testimonial-stage {
            grid-template-columns: 1fr;
          }

          .testimonial-card-wrap {
            min-height: 360px;
          }

          .testimonial-card {
            min-height: 350px;
            padding-inline: 28px;
          }

          .testimonial-arrow {
            position: absolute;
            z-index: 4;
            bottom: 2px;
          }

          .testimonial-arrow--left {
            left: calc(50% - 72px);
          }

          .testimonial-arrow--right {
            right: calc(50% - 72px);
          }

          .testimonial-dots {
            margin-top: 72px;
          }

          .testimonial-ghost {
            width: 70%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .testimonial-arrow,
          .testimonial-dots button {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}

function initials(name: string): string {
  if (name.startsWith("[[")) return "✦";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
