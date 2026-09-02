import { notFound } from "next/navigation";
import { DetailView } from "@/components/DetailView";
import { domains, getDomain } from "@/lib/domains";

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
