import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailView } from "@/components/DetailView";
import { domains, getDomain } from "@/lib/domains";

/**
 * Per-domain title and description. These nine are the pages that sell, and
 * they previously shared the site-wide title, so search results and shared
 * links could not tell them apart.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const domain = getDomain(decodeURIComponent(slug));
  if (!domain) return { title: "Domain not found" };

  const title = `Domain ${domain.letter}: ${domain.title} | BCBA Prep by Bee the Behavior Bae`;
  const description = `Study materials for Domain ${domain.letter} of the BCBA exam — ${domain.title}. ${domain.questions} of the 175 scored items, ${domain.percent}% of the exam.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
  };
}

export function generateStaticParams() {
  return domains.map((domain) => ({ slug: domain.slug }));
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const domain = getDomain(decodeURIComponent(slug));

  if (!domain) {
    notFound();
  }

  return <DetailView domain={domain} />;
}
