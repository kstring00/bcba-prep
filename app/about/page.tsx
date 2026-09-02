import Link from "next/link";

export const metadata = { title: "[[TODO_ABOUT_TITLE]]" };

export default function Page() {
  return (
    <div className="prose">
      <h1>[[TODO_ABOUT_TITLE]]</h1>
      <p>[[TODO_ABOUT_BODY]]</p>
      <Link href="/" className="back-link">
        &larr; Back to the stack
      </Link>
    </div>
  );
}
