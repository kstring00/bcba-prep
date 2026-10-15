import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOwnedSkus } from "@/lib/entitlements/server";
import { getLibraryContent, contentForSku } from "@/lib/entitlements/library";
import { domainSku } from "@/lib/catalog";
import { getDomain } from "@/lib/domains";
import { ContentPanel } from "../../ContentPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const domain = getDomain(slug);
  return {
    title: domain
      ? `Domain ${domain.letter} — ${domain.title} | My Library`
      : "My Library",
    robots: { index: false, follow: false },
  };
}

/**
 * One click from a domain card to its materials.
 *
 * Gated twice on purpose: signed out → sign-in, signed in but not an owner →
 * the sales page. A non-owner never sees this page's contents, and the files
 * themselves are gated again in /api/content/[id].
 */
export default async function MemberDomainPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const domain = getDomain(slug);
  if (!domain) notFound();

  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?next=/member/domain/${slug}`);

  const sku = domainSku(slug);
  const ownedSkus = await getOwnedSkus();

  // Not an owner: send them to the page where they can buy it, rather than
  // showing an empty shell or a bare error.
  if (!ownedSkus.includes(sku)) {
    redirect(`/domain/${slug}`);
  }

  const content = await getLibraryContent();

  return (
    <ContentPanel
      eyebrow={`Domain ${domain.letter}`}
      title={domain.title}
      meta={`${domain.questions} of 175 scored items · ${domain.percent}%`}
      tone={domain.cloth}
      foil={domain.foil}
      spineLabel={domain.letter}
      items={contentForSku(content, sku)}
      footer={
        <Link href="/member" className="back-link">
          &larr; Back to My Library
        </Link>
      }
    />
  );
}
