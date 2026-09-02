import Link from "next/link";

export const metadata = { title: "[[TODO_UPDATES_TITLE]]" };

export default function Page() {
  return (
    <div className="prose">
      <h1>[[TODO_UPDATES_TITLE]]</h1>
      <p>[[TODO_UPDATES_BODY]]</p>
      <Link href="/" className="back-link">
        &larr; Back to the stack
      </Link>
    </div>
  );
}
