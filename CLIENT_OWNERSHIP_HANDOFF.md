# Client Ownership Handoff — BCBA Prep

**Client:** Bryana Utley / Bee the Behavior Bae
**Developer:** Kyle
**Repo:** `kstring00/bcba-prep`
**Prepared:** 2026-09-07

---

## 🔴 READ THIS BEFORE THE FIRST REAL PAYMENT

**The Stripe account must be in Bryana's name, with her banking details and her
tax details, before a single real customer pays.**

This is not a preference or a tidy-up task. It determines three things:

1. **Who receives the money.** Payouts go to the bank account on the Stripe
   account. If that account is Kyle's, Bryana's revenue lands in Kyle's bank and
   has to be forwarded manually — which creates a bookkeeping mess and, depending
   on volume, a tax problem for Kyle.

2. **Who is liable for chargebacks.** When a customer disputes a charge, Stripe
   debits the account holder — including the dispute fee, whether or not the
   dispute is won. If the account is in Kyle's name, **Kyle is financially liable
   for Bryana's customers' disputes.**

3. **Who receives the 1099.** Stripe issues the tax form to the account holder.
   If the account is in Kyle's name, Kyle receives a 1099 for income that is not
   his and must reconcile it with the IRS.

**Migrating a Stripe account after it has processed real payments is genuinely
painful.** It typically means creating a new account, re-onboarding, re-issuing
API keys, re-registering the webhook, redeploying, and leaving the old payment
history stranded in the old account. Doing it before the first sale costs about
an hour. Doing it after costs a day and creates a permanent split in the records.

**Do this first. Everything else on this page can wait.**

---

## Ownership table

| Service | Current owner | Desired owner | Transfer needed? | Notes |
|---|---|---|---|---|
| **Domain registration** | **VERIFY WITH KYLE** | Bryana | **VERIFY WITH KYLE** | No registrar or domain name appears anywhere in the repository. `NEXT_PUBLIC_SITE_URL` is set at deploy time, not in git. Kyle must state the registrar, the exact domain, whose card is on file, and the expiry date. |
| **Stripe account** | **VERIFY WITH KYLE** | **Bryana — mandatory** | **VERIFY WITH KYLE** | 🔴 Highest priority. See the box above. Repo shows only variable *names*; account identity is invisible from code. |
| **Supabase project** | **VERIFY WITH KYLE** | Bryana | **VERIFY WITH KYLE** | A specific project ref is hardcoded in four source files, so the project is real and in active use. Who created it and under which login is **not** determinable from the repo. |
| **Vercel project** | **VERIFY WITH KYLE** | Bryana (or Bryana as owner, Kyle as member) | **VERIFY WITH KYLE** | Commit `fbee249` references a "Pro deployment", which suggests a paid Vercel plan. Whose plan and whose card is unknown from the repo. |
| **Microsoft Clarity** | **VERIFY WITH KYLE** | Bryana | **VERIFY WITH KYLE** | A project ID is hardcoded at `components/MicrosoftClarity.tsx:7`, so a real Clarity project exists and is receiving data. The Microsoft account behind it is unknown from the repo. |
| **Business email** | **VERIFY WITH KYLE** | Bryana | **VERIFY WITH KYLE** | No mail provider is configured in the application. The optional testimonial alert uses Resend via `RESEND_API_KEY`, `TESTIMONIAL_REVIEW_EMAIL`, `TESTIMONIAL_FROM_EMAIL` — none of which is set in the repo. **[UNVERIFIED]** whether a Resend account exists at all. |
| **Source repository** | **Kyle** (`github.com/kstring00/bcba-prep`) — verified from the git remote | Bryana, or Bryana with Kyle as collaborator | **Yes** | This is the only ownership fact the repository proves. Transfer, or add Bryana as an admin so she is never locked out of her own code. |
| **Content and assets** | **Bryana** (author) | Bryana | No | The nine domain titles, question counts and percentages (`lib/domains.ts`) and the About page copy were supplied by Bryana per `README.md:65-76`. **The study materials themselves do not exist in this repository** — they are entirely Bryana's, wherever she holds them. |
| **Design and code authorship** | Kyle | — | Agree in writing | Who may reuse this code, and whether Bryana receives an assignment of rights or a licence, is a contract question. **Requires an attorney.** Nothing in the repo addresses it. |

---

## Why so many rows say VERIFY WITH KYLE

A git repository records code. It does not record who pays for a service, whose
name is on an account, or whose card renews a domain.

**What this audit could actually establish:**

- ✅ The GitHub remote is `https://github.com/kstring00/bcba-prep` — so the repo
  sits under Kyle's account.
- ✅ A specific Supabase project and a specific Clarity project are hardcoded in
  source, so both exist and are live.
- ✅ Stripe, Supabase, Clarity and Resend are referenced by environment-variable
  **name** only. No credential values are stored in git, and none ever were.

**What it could not establish, and why:**

- ❌ Every account's owner. Not knowable from code.
- ❌ Whose payment card is on file anywhere. Not knowable from code.
- ❌ The production domain name. Set at deploy time.
- ❌ Whether Stripe is in test or live mode. A dashboard setting.

The audit environment also had **no network access** to Stripe, Supabase or
Vercel — outbound requests to those hosts were refused by the sandbox proxy. So
none of it could be checked directly either.

**These are not guesses left open out of caution. They are simply not in the
repository. Kyle must fill each one in.**

---

## Transfer checklist

Work top to bottom. Stripe first.

### 1. Stripe — 🔴 do this before any real payment

- [ ] Confirm whose legal name and tax ID are on the account
- [ ] If it is not Bryana's: **create a new Stripe account in her name now**
- [ ] Bryana completes Stripe onboarding herself — identity, business details, tax
- [ ] Bryana's bank account is the payout destination
- [ ] Bryana's email is the account owner email
- [ ] Kyle is added as a **team member** for support, not as the owner
- [ ] Generate new API keys; update `STRIPE_SECRET_KEY` in Vercel; redeploy
- [ ] Register the webhook endpoint on the new account; update `STRIPE_WEBHOOK_SECRET`; redeploy
- [ ] Run one test-mode purchase end to end on the new account
- [ ] Confirm the webhook shows a **200** in Recent deliveries

### 2. Domain

- [ ] Kyle states the registrar and the exact domain name
- [ ] Transfer to a registrar account in Bryana's name, or transfer ownership within the existing registrar
- [ ] Bryana's payment card on file
- [ ] **Auto-renew ON** — an expired domain takes the site offline and the name can be bought by anyone
- [ ] Record the expiry date somewhere Bryana will actually see it

### 3. Vercel

- [ ] Confirm which account or team owns the project
- [ ] Transfer to a Vercel account in Bryana's name, or make her the team owner
- [ ] Bryana's card on file if the plan is paid
- [ ] Kyle retains member access for support
- [ ] Confirm the production branch after the branch cleanup in `TECHNICAL_HANDOFF.md` §15
- [ ] Re-verify every environment variable survived the transfer, by name

### 4. Supabase

- [ ] Confirm which login owns the project
- [ ] Transfer the project to an organization owned by Bryana
- [ ] Bryana's card on file if the plan is paid
- [ ] Kyle retains member access
- [ ] Confirm the project ref did not change — if it did, the hardcoded fallbacks in four source files must be updated in the same change

### 5. Microsoft Clarity

- [ ] Confirm which Microsoft account owns the project
- [ ] Add Bryana as an owner, or recreate the project under her account
- [ ] If recreated, update `NEXT_PUBLIC_CLARITY_PROJECT_ID` in Vercel **and** remove the hardcoded fallback at `components/MicrosoftClarity.tsx:7`

### 6. Business email

- [ ] Decide the customer-facing address (e.g. `hello@<domain>`)
- [ ] Set it up on a real mail provider in Bryana's name
- [ ] Confirm Bryana can send and receive from it
- [ ] Use it as the account email for Stripe, Vercel, Supabase and Clarity
- [ ] Once the contact form is fixed, this is where those messages must land

### 7. Repository

- [ ] Transfer `kstring00/bcba-prep` to Bryana, **or** add her as an admin
- [ ] Bryana has her own GitHub login and knows how to sign in
- [ ] Kyle retains push access for ongoing work

### 8. Credentials

- [ ] Bryana sets **her own** password on every account. Kyle should not know them.
- [ ] Two-factor authentication enabled on Stripe at minimum — ideally on all five
- [ ] Recovery codes saved somewhere Bryana controls
- [ ] Use a password manager, not a notebook and not a spreadsheet
- [ ] **No credential is ever sent by email or text message**

### 9. Written record

- [ ] Fill in the table at the top of this document with real names and dates
- [ ] Both parties keep a copy
- [ ] Agree in writing who may deploy code, and who is contacted when the site breaks

---

## A note on separation of duties

The healthy end state is: **Bryana owns everything; Kyle has access to
everything.**

Not the other way around. If Kyle owns the accounts, Bryana cannot run her own
business without him — she cannot change a payout account, cannot respond to a
Stripe compliance request, and cannot bring in another developer. If Kyle becomes
unavailable for any reason, she is locked out of her own revenue.

Making Bryana the owner and Kyle a team member costs nothing and removes that
entire class of risk. Every service listed here supports it natively.
