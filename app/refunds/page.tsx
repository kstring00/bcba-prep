import Link from "next/link";

export const metadata = { title: "Refunds" };

export default function RefundsPage() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>Refunds</h1>
        <p>[[TODO_REFUND_POLICY]]</p>
        <Link href="/" className="back-link">
          &larr; Back to the stack
        </Link>
      </div>
    </div>
  );
}
