"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import type { Domain } from "@/lib/domains";
import { Book } from "./Book";

export function DomainView({ domain }: { domain: Domain }) {
  const reduceMotion = useReducedMotion();

  return (
    <article>
      <div className="domain-cover-row">
        {/* Same layoutId as the spine on the shelf — Motion treats the two as
            one object, so the spine travels here and rotates flat. */}
        <Book domain={domain} variant="cover" />
      </div>

      <motion.div
        className="domain-body"
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.34, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }
        }
      >
        {/*
          [[TODO_DOMAIN_CONTENT_STRUCTURE]]

          Study content for this domain mounts here: module list, per-module
          reading, practice items, progress. Nothing is built in this pass —
          the shelf is navigation, the content is the product, and the content
          shape is not decided yet.
        */}
        <section className="content-slot">[[TODO_DOMAIN_CONTENT_STRUCTURE]]</section>

        <Link href="/" className="back-link">
          &larr; All domains
        </Link>
      </motion.div>
    </article>
  );
}
