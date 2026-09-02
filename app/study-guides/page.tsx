import Link from "next/link";

export const metadata = { title: "[[TODO_STUDY_GUIDES_TITLE]]" };

export default function Page() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>[[TODO_STUDY_GUIDES_TITLE]]</h1>
        <p>[[TODO_STUDY_GUIDES_BODY]]</p>
        <Link href="/" className="back-link">
          &larr; Back to the library
        </Link>
      </div>
    </div>
  );
}
