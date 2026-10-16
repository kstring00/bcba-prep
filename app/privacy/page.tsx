import Link from "next/link";

export const metadata = { title: "Privacy" };

/**
 * Written to describe what this site actually does today, not a generic
 * template. If a data flow changes — a new form, a new third party, automated
 * fulfillment — this page has to change with it.
 */
export default function PrivacyPage() {
  return (
    <div className="shell">
      <div className="prose">
        <h1>Privacy</h1>
        <p>
          This page explains what BCBA Prep by Bee the Behavior Bae collects,
          why, and who else can see it. It describes how the site works today.
        </p>

        <h2>What we collect</h2>
        <p>
          <strong>If you create an account:</strong> your email address and a
          password. The password is stored by our authentication provider in a
          hashed form; it is never visible to us in readable text.
        </p>
        <p>
          <strong>If you use the contact form:</strong> your name, email
          address, chosen topic, and the message you write. This is sent to
          Bee&rsquo;s email inbox so she can reply.
        </p>
        <p>
          <strong>If you submit a testimonial:</strong> the display name you
          choose, your email address, and the words you write. Your email is
          kept private and is not published with your testimonial; it is stored
          so Bee can contact you about what you submitted.
        </p>
        <p>
          <strong>If you make a purchase:</strong> your payment is handled by
          Stripe. See &ldquo;Payments&rdquo; below.
        </p>

        <h2>Where it is stored</h2>
        <p>
          Account details and testimonial submissions are stored with{" "}
          <strong>Supabase</strong>, a hosted database provider. Contact-form
          messages are delivered by email through <strong>Resend</strong>, an
          email delivery provider, and then live in Bee&rsquo;s email inbox.
          This website is hosted by <strong>Vercel</strong>.
        </p>

        <h2>What is stored on your device</h2>
        <p>
          If you sign in, your browser keeps a sign-in token in its local
          storage so you stay signed in between pages. Signing out removes it.
          Clearing your browser data also removes it.
        </p>

        <h2>Your cart</h2>
        <p>
          The cart is held in memory for the length of your visit only. It is
          not written to your device and does not survive a page reload.
        </p>

        <h2>Payments</h2>
        <p>
          Payment is taken by Stripe on Stripe&rsquo;s own hosted checkout. Card
          details are entered on Stripe&rsquo;s page and are never sent to, or
          stored on, this site.
        </p>

        <h2>Microsoft Clarity</h2>
        <p>
          When Microsoft Clarity is enabled on this site, it may be used to
          understand how visitors move through and interact with the website,
          including aggregated usage patterns, heatmaps, and session
          recordings. Clarity is used to help improve the site experience, not
          to determine access to purchased materials.
        </p>
        <p>
          Microsoft states that Clarity masks sensitive content by default. Any
          production use of Clarity should also follow the consent and privacy
          requirements that apply to this site&rsquo;s visitors.
        </p>

        <h2>What we do not do</h2>
        <p>
          We do not sell your information. We do not share it with anyone
          beyond the providers named above, who process it on our behalf so the
          site can function. We do not send marketing email from the details
          collected on this site.
        </p>

        <h2>Your choices</h2>
        <p>
          You can ask to see what we hold about you, ask for it to be
          corrected, or ask for it to be deleted. Deleting your account removes
          your account record.{" "}
          <Link href="/contact">Contact Bee</Link> to make any of these
          requests.
        </p>

        <h2>Questions</h2>
        <p>
          If anything here is unclear, please{" "}
          <Link href="/contact">get in touch</Link>.
        </p>

        <Link href="/" className="back-link">
          &larr; Back to the stack
        </Link>
      </div>
    </div>
  );
}
