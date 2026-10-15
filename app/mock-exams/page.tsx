import type { Metadata } from "next";
import Link from "next/link";
import { BeeMark } from "@/components/BeeMark";
import { Ornament } from "@/components/Florals";
import { OwnershipCta } from "@/components/OwnershipCta";
import { isPurchasable, mockExams } from "@/lib/catalog";
import { getProduct } from "@/lib/products";

export const metadata: Metadata = {
  title: "Mock Exams | BCBA Prep by Bee the Behavior Bae",
  description:
    "Full-length BCBA mock exams written to mirror the structure and weighting of the real exam, so you can find your weak areas before exam day.",
};

/**
 * Mock exams are a separate product line from the domain study materials, not
 * a subsection of them — a candidate can buy an exam without buying a domain,
 * and the library keeps them apart for the same reason.
 *
 * Question count and price come from lib/catalog.ts and may be `null`. When
 * they are, this page says so plainly rather than printing a number nobody
 * has confirmed. That is deliberate: see the note at the top of that file.
 */
export default function MockExamsPage() {
  return (
    <div className="shell">
      <header className="exams-head">
        <p className="script">Practice under real conditions</p>
        <h1 className="display">Mock Exams</h1>
        <Ornament wide />
        <p className="exams-lede">
          Working through the domains builds knowledge. A full-length mock exam
          tells you whether you can use it under pressure — and shows you where
          to go back.
        </p>
      </header>

      <section className="exams-what" aria-labelledby="what-these-are">
        <h2 id="what-these-are">What these are</h2>
        <ul className="exams-points">
          <li>
            <strong>Full-length.</strong> Built to mirror the structure and
            domain weighting of the real exam, not a short quiz.
          </li>
          <li>
            <strong>Scenario-based.</strong> Questions ask you to apply a
            concept to a situation, which is how the exam asks them.
          </li>
          <li>
            <strong>Written by Bee.</strong> Same voice and the same standard
            as the domain materials.
          </li>
        </ul>
      </section>

      <section className="exams-list" aria-labelledby="available-exams">
        <h2 id="available-exams">Available exams</h2>

        {mockExams.map((exam) => {
          const product = getProduct(`exam-${exam.id}`);
          return (
            <article className="exam-card" key={exam.id}>
              <div className="exam-card-mark" aria-hidden="true">
                <BeeMark size={26} />
              </div>

              <div className="exam-card-body">
                <h3>{exam.name}</h3>
                <p>{exam.blurb}</p>

                <dl className="exam-facts">
                  <div>
                    <dt>Questions</dt>
                    <dd>
                      {exam.questionCount ?? "Being finalised"}
                    </dd>
                  </div>
                  <div>
                    <dt>Format</dt>
                    <dd>
                      {exam.delivery === "file"
                        ? "Downloadable document"
                        : "Interactive exam"}
                    </dd>
                  </div>
                  <div>
                    <dt>Who it is for</dt>
                    <dd>{exam.audience}</dd>
                  </div>
                </dl>

                {!isPurchasable(exam.priceCents) ? (
                  <p className="exam-note">
                    Pricing is being finalised. This exam is not on sale yet.
                  </p>
                ) : null}

                <OwnershipCta
                  sku={exam.sku}
                  product={product}
                  tone="#5C4767"
                  unlockLabel="Add mock exam"
                />
              </div>
            </article>
          );
        })}
      </section>

      <section className="exams-footer">
        <p>
          Looking for the study materials behind these questions?{" "}
          <Link href="/">Browse the nine domains</Link>.
        </p>
      </section>
    </div>
  );
}
