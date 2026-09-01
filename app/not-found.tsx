import Link from "next/link";

export default function NotFound() {
  return (
    <div className="domain-body">
      <p className="content-slot">That shelf position is empty.</p>
      <Link href="/" className="back-link">
        &larr; All domains
      </Link>
    </div>
  );
}
