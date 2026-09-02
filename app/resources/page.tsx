import Link from "next/link";

export const metadata = { title: "[[TODO_RESOURCES_TITLE]]" };

export default function Page() {
  return (
    <div className="prose">
      <h1>[[TODO_RESOURCES_TITLE]]</h1>
      <p>[[TODO_RESOURCES_BODY]]</p>
      <Link href="/" className="back-link">
        &larr; Back to the stack
      </Link>
    </div>
  );
}
