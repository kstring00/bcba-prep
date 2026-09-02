import Link from "next/link";

export default function NotFound() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>Not found</h1>
        <p>That shelf position is empty.</p>
        <Link href="/" className="back-link">
          &larr; Back to the stack
        </Link>
      </div>
    </div>
  );
}
