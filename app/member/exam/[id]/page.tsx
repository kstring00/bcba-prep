import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { getOwnedSkus } from "@/lib/entitlements/server";
import { getLibraryContent, contentForSku } from "@/lib/entitlements/library";
import { getMockExam } from "@/lib/catalog";
import { ContentPanel } from "../../ContentPanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const exam = getMockExam(id);
  return {
    title: exam ? `${exam.name} | My Library` : "My Library",
    robots: { index: false, follow: false },
  };
}

export default async function MemberExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exam = getMockExam(id);
  if (!exam) notFound();

  const user = await getSessionUser();
  if (!user) redirect(`/sign-in?next=/member/exam/${id}`);

  const ownedSkus = await getOwnedSkus();
  if (!ownedSkus.includes(exam.sku)) {
    redirect("/mock-exams");
  }

  const content = await getLibraryContent();

  return (
    <ContentPanel
      eyebrow="Mock exam"
      title={exam.name}
      meta={
        exam.questionCount
          ? `${exam.questionCount} questions`
          : "Full-length practice exam"
      }
      tone="#5C4767"
      foil="#D9BE83"
      spineLabel="✎"
      items={contentForSku(content, exam.sku)}
      footer={
        <Link href="/member" className="back-link">
          &larr; Back to My Library
        </Link>
      }
    />
  );
}
