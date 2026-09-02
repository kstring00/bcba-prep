import Link from "next/link";

export const metadata = { title: "[[TODO_MOCK_EXAMS_TITLE]]" };

export default function Page() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>[[TODO_MOCK_EXAMS_TITLE]]</h1>
        <p>[[TODO_MOCK_EXAMS_BODY]]</p>
        <Link href="/" className="back-link">
          &larr; Back to the library
        </Link>
      </div>
    </div>
  );
}
