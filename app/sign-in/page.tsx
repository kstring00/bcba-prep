import Link from "next/link";

export const metadata = { title: "[[TODO_SIGN_IN_TITLE]]" };

export default function Page() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>[[TODO_SIGN_IN_TITLE]]</h1>
        <p>[[TODO_SIGN_IN_BODY]]</p>
        <Link href="/" className="back-link">
          &larr; Back to the stack
        </Link>
      </div>
    </div>
  );
}
