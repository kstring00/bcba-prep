"use client";

import Link from "next/link";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useCallback, useRef } from "react";
import { AddToCart } from "./AddToCart";
import { Book } from "./Book";
import type { Domain } from "@/lib/domains";
import { SCORED_ITEMS } from "@/lib/domains";
import { formatPrice, getProductForDomain } from "@/lib/products";

export function DetailView({ domain }: { domain: Domain }) {
  const reduceMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const product = getProductForDomain(domain.slug);
  const price = product ? formatPrice(product.price) : null;

  const stageOpacity = useMotionValue(1);
  const stageScale = useMotionValue(1);

  const onDepart = useCallback(() => {
    stageOpacity.set(0);
    stageScale.set(0.82);
  }, [stageOpacity, stageScale]);

  const onArrive = useCallback(() => {
    animate(stageOpacity, 1, { duration: 0.2, ease: "linear" });
    animate(stageScale, 1, {
      type: "spring",
      stiffness: 420,
      damping: 22,
    });
  }, [stageOpacity, stageScale]);

  return (
    <article className="shell detail">
      <motion.div
        ref={stageRef}
        className="detail-cover-stage"
        style={
          reduceMotion
            ? undefined
            : { opacity: stageOpacity, scale: stageScale }
        }
      >
        <Book domain={domain} variant="cover" />
      </motion.div>

      <motion.div
        className="detail-body"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.36, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }
        }
      >
        <span className="detail-letter">Domain {domain.letter}</span>
        <h1 className="detail-title">{domain.title}</h1>

        <p className="weight-line">
          <strong>{domain.questions}</strong> of the{" "}
          <strong>{SCORED_ITEMS}</strong> scored items on the exam —{" "}
          <strong>{domain.percent}%</strong>.
        </p>

        <section className="contents-slot">
          <strong>One domain. One focused library.</strong>
          <br />
          Your purchase grants a personal license to the study materials Bee
          publishes for Domain {domain.letter}. The detailed contents of this
          domain library are being finalized and will be listed here as they are
          loaded into the site.
        </section>

        <div className="buy-row">
          <span className="price">{price}</span>
          {product ? (
            <AddToCart
              product={product}
              tone={domain.cloth}
              sourceRef={stageRef}
              onDepart={onDepart}
              onArrive={onArrive}
              label="Add domain license"
            />
          ) : null}
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--ink-dim)" }}>
          Personal, non-transferable use. Any 3 domains $75 · any 5 $115 · all 9 $179.
        </p>

        <Link href="/" className="back-link">
          &larr; Back to the stack
        </Link>
      </motion.div>
    </article>
  );
}
