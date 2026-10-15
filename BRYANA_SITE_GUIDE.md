# Your Website — The Owner's Guide

**For Bryana Utley · BCBA Prep by Bee the Behavior Bae**

This guide is written so you never need to understand code.

You will see the words **ASK KYLE** in bold. That means the task needs a
developer. It is not something you did wrong. Some things simply require code.

This guide describes what your website does **today**. Where the real process is
clunky, this guide says so. It will not pretend something is easy when it is not.

---

## ⚠️ READ THIS FIRST

**Your website is live and safe. It is not selling anything yet — on purpose.**

You are finishing your own BCBA exam before releasing your study materials.
Until you are ready, your website has been put into a safe **pre-launch** state.

Here is what that means:

- ✅ Your website works. People can read every page.
- ✅ People can create an account and sign in.
- ✅ People can send you a message.
- ✅ People can send you a testimonial.
- 🔒 **Nobody can buy anything.** Prices and buy buttons are hidden, and the
  payment system is switched off. Even someone who tried to force a purchase
  would be blocked.
- 🔒 **Google cannot find your site yet.** That is also on purpose.

**You do not need to do anything to keep it safe.** It stays this way until
Kyle deliberately turns selling on, which happens after you pass and after your
materials are ready.

**Why this matters:** you cannot accidentally take someone's money for
materials you have not finished. That was the biggest risk, and it is now
closed.

When you pass your exam, tell Kyle. He has a short list of steps to open the
store. It is in a file called `LAUNCH_CHECKLIST.md`.

---

## START HERE

You need five accounts. That is all. Here is what each one does.

### 1. Your web address (domain name)

**What it does:** This is your website's name, like `beethebehaviorbae.com`.
People type it to find you.

**Where to sign in:** **ASK KYLE.** He knows which company you bought the name
from. Write it here when he tells you: `_______________________`

**How often you use it:** Almost never. Once a year to renew it.

### 2. Vercel

**What it does:** Vercel is the company that keeps your website turned on and
visible to the world. Think of it as the building your store sits in.

**Where to sign in:** `vercel.com`

**How often you use it:** Almost never. Kyle uses this, not you.

### 3. Stripe

**What it does:** Stripe takes the credit card payments and sends the money to
your bank. **This is the most important account you own.**

**Where to sign in:** `dashboard.stripe.com`

**How often you use it:** Every week. This is where you check sales and give
refunds.

### 4. Supabase

**What it does:** Supabase is the filing cabinet. It stores customer accounts,
messages people send you, and testimonials people submit.

**Where to sign in:** `supabase.com`

**How often you use it:** This is not built for you to use. It looks like a
spreadsheet program for engineers. **ASK KYLE** before you open it.

### 5. Microsoft Clarity

**What it does:** Clarity counts your visitors and records how they move around
your site.

**Where to sign in:** `clarity.microsoft.com`

**How often you use it:** Once a month, if you feel like it.

> **Before your first sale:** Kyle must confirm that all five accounts are in
> **your** name, with **your** email. Especially Stripe. See the separate
> `CLIENT_OWNERSHIP_HANDOFF.md` document for why this matters a great deal.

---

## HOW SOMEONE BUYS SOMETHING

**Right now, nobody can.** Selling is switched off. This section describes what
will happen once Kyle turns it on.

Today, a visitor sees this instead of a price:

> **Not yet available for purchase**
> Bee is finishing her own BCBA certification before releasing these study
> materials. Domain licenses are not on sale yet — nothing here can be
> purchased today.

**Once selling is turned on**, the trip looks like this:

1. They open your website.
2. They see nine books stacked up. Each book is one exam domain.
3. They click a book. It opens to a page for that domain.
4. They click **Add domain license**. A little book flies into the cart.
5. They click the cart. They see their total. If they picked 3 domains, the
   price drops to $75 by itself. If they picked 5, it drops to $115. If they
   picked 8 or 9, it drops to $179.
6. They click **Purchase licenses**. Stripe's payment page opens. They type
   their card number **on Stripe's page, never on yours.**
7. They land on a Thank-you page telling them their materials are coming by
   email.
8. **You send them the materials.**

Step 8 is done by hand unless Kyle builds automatic delivery first. That is a
decision the two of you make when you are ready — see `LAUNCH_CHECKLIST.md`.

### About the prices

Your prices are set and correct. Kyle tested every combination. They are simply
hidden while the store is closed.

| What they pick | What they pay |
|---|---|
| 1 domain | $29 |
| 2 domains | $58 |
| **3 domains** | **$75** |
| 4 domains | $104 |
| **5 domains** | **$115** |
| 6 domains | $144 |
| 7 domains | $173 |
| **8 or 9 domains** | **$179** |

Notice that 8 domains and 9 domains both cost $179. That is on purpose. If
someone picks 8, the website gives them all 9 for the same price. That is a
nice surprise for them and it is working correctly.

**Nobody can cheat the price.** Kyle checked this carefully. A customer cannot
change the amount using their browser. The price is decided on your side, not
theirs.

## HOW TO CHECK A SALE

**There are no sales yet — selling is switched off.** Keep this section for
when the store opens; the steps will be exactly these.

Everything about money lives in Stripe.

1. Go to `dashboard.stripe.com` and sign in.
2. On the left, click **Payments**.
3. You will see a list. Each row is one sale. Newest at the top.
4. Click any row to open it.

**On that page you will see:**

- **The amount** they paid.
- **The customer's email address.** This is how you contact them.
- **The date and time.**
- Whether it **Succeeded** or failed.

**To see exactly which domains they bought:**

1. On that same payment page, scroll down to the section called **Metadata**.
2. Look for a line called `entitlement_slugs`.
3. It lists the domains they bought, separated by commas.

The names in that list are short codes. Here is what they mean:

| Code you will see | Domain |
|---|---|
| `foundations` | Domain A — Behaviorism and Philosophical Foundations |
| `principles` | Domain B — Concepts and Principles |
| `measurement` | Domain C — Measurement, Data Display, and Interpretation |
| `experimental-design` | Domain D — Experimental Design |
| `ethics` | Domain E — Ethical and Professional Issues |
| `assessment` | Domain F — Behavior Assessment |
| `behavior-change` | Domain G — Behavior-Change Procedures |
| `interventions` | Domain H — Selecting and Implementing Interventions |
| `supervision` | Domain I — Personnel Supervision and Management |

**Print this table or keep it open. You will use it for every single sale.**

**To confirm they got access:** You cannot. There is no access to give yet.
**You must email the materials to them yourself, by hand.** Copy their email
address from Stripe, open your own email, and send the files.

> **Keep your own list.** Until Kyle builds something better, keep a simple
> spreadsheet. Four columns: **Date · Customer email · Domains they bought · Did
> I send it? (yes/no)**. This is your only safety net. Do not skip it.

---

## HOW TO REFUND SOMEONE

**Nobody has paid you through the website yet, so there is nothing to refund
today.** Keep this for when the store opens.

Refunds happen entirely in Stripe. It takes about thirty seconds.

1. Go to `dashboard.stripe.com` and sign in.
2. Click **Payments** on the left.
3. Find the customer's payment. You can search by their email address using the
   search box at the top.
4. Click the payment to open it.
5. In the top right corner, click the **...** button (three dots).
6. Click **Refund payment**.
7. A box opens. To give all their money back, leave the amount as it is. To give
   part of it back, type a smaller number.
8. Click **Refund**.

**That is it.** The money goes back to their card. It usually shows up on their
statement in 5 to 10 days. Stripe emails them automatically.

### What happens to their access after a refund?

**Nothing happens, because there is no automatic access.**

If you already emailed them the study materials, **they still have those files.**
Refunding in Stripe does not reach into their inbox and take the files back.
Nothing can do that.

So: **decide before you send.** Once files leave your hands, they are gone.

Later, when Kyle builds automatic access, refunding will need a second step to
turn that access off. **ASK KYLE** when that day comes.

---

## HOW TO HELP SOMEONE WHO CANNOT LOG IN

Work through these questions in order. Stop when you reach an answer.

**Q1. Did they actually buy something?**
- Check Stripe → **Payments** → search their email.
- **NO, no payment found** → They may have used a different email address. Ask
  them which email they paid with. Search again. Still nothing? They did not
  buy. Politely tell them so.
- **YES, payment found** → Go to Q2.

**Q2. Do they have an account on your site?**
- Accounts and payments are **completely separate right now.** Someone can pay
  without ever making an account. Someone can make an account without ever
  paying.
- **They never made an account** → Send them to `yoursite.com/sign-in` and tell
  them to click **Create account**. Then go to Q3.
- **They made an account** → Go to Q3.

**Q3. Can they remember their password?**
- **YES** → They should be able to sign in. If they cannot, go to Q5.
- **NO** → Go to Q4.

**Q4. They forgot their password.**
- On the sign-in page there is a **Forgot password?** link. They type their
  email and click it.
- They get an email with a link.
- They click that link. It opens a page on your site where they type a new
  password twice.
- They click **Save new password**. Then they sign in with the new one.
- ✅ **This works now.** If the link says it has expired, that is normal —
  links only last a short time and only work once. They should just request a
  new one.
- If it still does not work, **ASK KYLE**.

**Q5. They are signed in but see no study materials.**
- This is **normal today.** Nobody sees materials. The library page is empty for
  everyone.
- Tell them: "Your materials are sent by email. Let me resend them now."
- Check your spreadsheet. Find their email. Send the files again.

**Q6. Nothing above worked.**
- **ASK KYLE.** Send him: the customer's email address, what they bought, what
  they tried, and what they saw.

---

## HOW TO ADD OR UPDATE STUDY MATERIAL

**You cannot do this yourself. There is no place to upload anything.**

This is the plain truth and it is important you understand it: your website has
**no** content manager, **no** upload button, and **no** file storage. There is
no hidden admin area. It does not exist.

**This is deliberate for now.** You are not releasing materials until you pass
your exam, so building the storage and delivery system would mean guessing at
what you will need. Kyle would rather build it around your real files than
around a guess.

**What to do in the meantime:** keep your study materials wherever you already
keep them — your computer, Google Drive, Dropbox. Organise them by domain, so
that when the time comes it is obvious which files belong to Domain A, Domain
B, and so on. That organisation is the useful work you can do now.

**When you are ready:** tell Kyle you have passed and your materials are done.
He has a checklist ready. Building the storage and the delivery system is real
development work — it is a project, not a setting.

**Do not let anyone tell you this is a quick fix.** It is not.

## HOW TO CHANGE A PRICE

**You cannot do this yourself. Prices are written in the code.**

**ASK KYLE.**

Prices live in one file. For Kyle, it is a small change — usually under an hour,
including testing. But it does require a developer and a new version of the site
going live.

**Please do not guess or experiment here.** A wrong price means you either lose
money on every sale or a customer is charged the wrong amount. Both are worse
than waiting a day for Kyle.

When you ask Kyle, tell him exactly:
- Which domain or bundle
- The old price
- The new price
- The date it should change

---

## HOW TO ADD A TESTIMONIAL

**You cannot write one yourself, and that is correct — testimonials should come
from real students.**

**Here is how it works:**

1. A student goes to your **Testimonials** page.
2. They scroll down and fill in the form: their name, their email, and what
   they want to say.
3. They tick a box saying you may publish it.
4. They click submit.
5. Their note is saved, and it is marked **waiting for review**.
6. ✅ **It does not appear on your website yet.** Nothing is published
   automatically.

**This is now working correctly.** Your Testimonials page says every note is
reviewed before it is published, and that is now true. Earlier it was not —
notes would have appeared instantly. That is fixed.

### Approving a note

Here is the honest, clunky part: **there is no approve button yet.**

To publish a note, someone has to open Supabase and change that note's status
from `pending` to `approved`. That is a database task.

**ASK KYLE.** Either he approves them for you, or he walks you through it once
on a call. Do not go digging in Supabase on your own — see the
**WHAT NOT TO TOUCH** section.

If testimonials start arriving regularly, tell Kyle. Building you a simple
approve screen is a small job and worth doing at that point — but not before,
because a screen for a thing that happens twice a year is wasted work.

### Getting told when one arrives

If Kyle has set up email alerts, you get an email each time someone submits a
note. If you are not getting those, **ASK KYLE** to switch them on.

## HOW TO CHECK CONTACT MESSAGES

✅ **This works now. Messages come straight to your email.**

Your **Contact** page has a form. When somebody fills it in and clicks send,
the message is emailed to your inbox. You read it like any other email.

**To reply:** just hit Reply. The email is set up so your reply goes back to
the person who wrote in, not to the website. You do not need to copy their
address out.

**What the email looks like:**

- The subject line starts with **BCBA Prep contact** and then the topic they
  chose.
- The message shows their name, their email, and what they wrote.

**If messages are not arriving:**

1. Check your spam folder first.
2. **ASK KYLE.** The delivery may need reconnecting.

**A safety feature worth knowing about:** if the email system is ever
misconfigured, the form does **not** pretend to work. The visitor is told
plainly that the form is unavailable and to email you directly. That is
deliberate — it is much better than someone thinking they reached you when
they did not.

**Spam protection is built in.** There is a hidden trap field that catches
automated bots, and a limit on how many messages one person can send in a short
time. You should not get flooded.

## HOW TO SEE SITE ANALYTICS

1. Go to `clarity.microsoft.com` and sign in.
2. Pick your site from the list.

**ASK KYLE** for the sign-in details the first time. He set this up.

**Only four numbers matter. Ignore everything else on the screen.**

**1. Sessions**
How many separate visits your site had. One person visiting twice counts as two.
*This is your foot traffic.* Is it going up week to week?

**2. Pages per session**
How many pages a visitor looked at before leaving.
- Around 1 means they arrived and left immediately.
- 3 or more means they explored your domains. That is good.

**3. Dead clicks**
People clicked something that did nothing. They thought it was a button.
*A high number here means something looks clickable but is not. Tell Kyle where
it is happening.*

**4. Rage clicks**
Someone clicked the same spot over and over, fast. They were frustrated.
*Any rage clicks on your cart or checkout are urgent. Tell Kyle immediately.*

**Recordings.** Clarity also saves videos of real visits. Watching three or four
is genuinely useful — you see exactly where people hesitate. It is not spying;
faces and typed text are hidden automatically.

**What Clarity cannot tell you:** it does **not** know who bought anything. It
does not track sales. **For money questions, always use Stripe, never Clarity.**

---

## WHAT NOT TO TOUCH

# ⚠️ THESE THINGS CAN BREAK YOUR WEBSITE

Read this list. These are the real ways this specific site gets broken.

### 🚫 Do not change anything in Vercel

Vercel is where your site lives. It has settings pages full of switches. **Do not
touch any of them.** One wrong switch takes your entire website offline. There is
no undo button that a non-developer can find.

### 🚫 Do not delete or change anything in Supabase

Supabase holds your customer accounts and their messages. It looks like a
spreadsheet. **It is not a spreadsheet.** Deleting a row there deletes a real
person's account, permanently. There is no trash can. There is no undo.

### 🚫 Do not turn on selling by yourself

Your store is deliberately switched off. There is one setting in Vercel that
turns it on. **Do not touch it, and do not let anyone else touch it**, until
you have passed your exam, your materials are finished, and Kyle has walked
through the launch checklist with you.

Turning it on early means a real person can pay you real money for materials
that do not exist yet. That leads to refunds, chargebacks, and — if it happens
enough — Stripe freezing your account.

### 🚫 Do not change your Stripe API keys

In Stripe there is a page called **Developers** or **API keys**. **Never touch
it.** Those keys are how your website proves to Stripe that it is really you. If
they change, **every sale stops immediately** and no one can buy anything until
Kyle fixes it.

### 🚫 Do not switch Stripe from Test mode to Live mode by yourself

There is a toggle in Stripe labelled **Test mode**. Flipping it changes whether
payments are real. **ASK KYLE** to do this with you, on a call, once. Doing it
alone can mean real customers get charged before the site is ready — or that real
customers cannot be charged at all.

### 🚫 Do not let anyone else push code to your website

If another developer offers to "just make a quick change," **say no until Kyle
knows.** There is one branch of code that, if merged by mistake, would delete
your member login, your testimonials page, and your sign-in page all at once.
Kyle knows which one. Nobody else will.

### 🚫 Do not let your web address expire

Your domain name renews once a year. If it lapses, **your site disappears** and
someone else can buy your name. Turn on auto-renew. Make sure the card on file is
current.

### 🚫 Do not delete emails from Stripe

Stripe emails you about disputes, failed payments, and account requirements.
Those emails have deadlines. Missing one can freeze your payouts. Make a folder.
Keep them.

### ✅ Things you can safely do any time

- Sign in to Stripe and look at anything.
- Refund a customer.
- Look at Clarity.
- Use your website like a customer would.
- Take screenshots.
- Email Kyle.

---

## WHEN TO CONTACT KYLE

**Contact him immediately — same day:**

- 🔴 **Your website will not load at all.**
- 🔴 **A customer paid but has no access, and you cannot work out what they
  bought.**
- 🔴 **Checkout is not working.** Test it yourself first: add a domain to the
  cart and click Purchase. Does Stripe's payment page open?
- 🔴 **Stripe emails you about a dispute or a chargeback.**
- 🔴 **You see something on your site that looks like a broken code word**, such
  as text in double square brackets. (These were all removed — if one comes
  back, something went wrong with a change.)
- 🔴 **A price or a Buy button appears when the store should still be closed.**
- 🔴 **A testimonial appears that you did not approve.**

**Contact him this week — not urgent:**

- 🟡 The layout looks wrong or crooked on your phone.
- 🟡 A link goes to the wrong place.
- 🟡 A typo you cannot fix yourself (which is all of them — you have no editor).
- 🟡 You want to change a price.
- 🟡 You want to add or update study materials.

**Contact him whenever — this is a project, not a fix:**

- 🟢 You want a new feature.
- 🟢 You want a design change.
- 🟢 You want to add a new domain or product.
- 🟢 You want to start a blog or an email list.

These are new work. They are not covered by your guarantee, and they need a
conversation about scope and cost first.

---

## WHAT IS INCLUDED IN THE 7-DAY LAUNCH SUPPORT

Kyle is on call for seven days after handover. Because the store is closed,
week one is about **learning your site and confirming it is safe**, not about
processing sales. When you later open the store, ask Kyle for a second short
support window covering the first real orders.

Here is the checklist to walk through together.

**Day 1 — Together, on a call**

- [ ] Confirm the store really is closed: open a domain page together and see
      the "Not yet available" notice instead of a price.
- [ ] Sign in to Stripe together. Bryana signs in herself, not Kyle.
- [ ] Confirm the Stripe account, bank details and tax details are Bryana's.
- [ ] Confirm every other account is in Bryana's name.

**Day 2 — Your own site**

- [ ] Create an account on the site as if you were a student.
- [ ] Sign out and sign back in.
- [ ] Read every page together and check the words are right.

**Day 3 — Customer problems**

- [ ] Walk the "cannot log in" decision tree together.
- [ ] Do a real password reset, start to finish, on Bryana's own account.
- [ ] Send a test message through the contact form and watch it arrive in her
      inbox. Reply to it and confirm the reply reaches the sender.
- [ ] Submit a test testimonial and confirm it does **not** appear on the site.

**Day 4 — Watching**

- [ ] Sign in to Clarity together.
- [ ] Look at the four numbers that matter.
- [ ] Watch one session recording together.

**Day 5 — Checking the site itself**

- [ ] Open every page on a phone.
- [ ] Confirm no broken code words are visible anywhere.
- [ ] Confirm the testimonials page behaves the way Bryana expects.
- [ ] Read the Privacy, Terms and Refunds pages together and confirm they say
      what Bryana wants them to say. Agree who takes them to an attorney.

**Day 6 — Emergency drill**

- [ ] Practise the "something is broken" steps at the end of this guide.
- [ ] Save Kyle's contact details in Bryana's phone.
- [ ] Agree what counts as an emergency and what can wait.

**Day 7 — Handover**

- [ ] Read `LAUNCH_CHECKLIST.md` together so Bryana knows what opening the
      store will involve when she is ready.
- [ ] Read this guide together, start to finish.
- [ ] Bryana writes down every question she still has.
- [ ] Kyle answers them and updates this guide.
- [ ] Confirm every account is in Bryana's name.

---

## 45-DAY WORKMANSHIP GUARANTEE

> **Please read this first.** This section is written in plain language so it is
> easy to understand. **It is operational wording, not legal advice.** It is not a
> contract. Before this becomes part of any agreement, **have an attorney review
> it.**

### What is covered

For **45 days** after your website goes live, Kyle will fix **bugs** in the
functionality that was delivered, at no extra charge.

**A bug means: something Kyle built stopped working, or never worked the way it
was agreed it should.**

Examples of covered bugs:

- The checkout button stops opening Stripe.
- A page that used to load now shows an error.
- The site breaks on a phone when it worked before.
- A link Kyle built points to the wrong page.
- A form Kyle built stops submitting.

**How to make a claim:** Email Kyle within the 45 days. Include the four things
listed at the end of this guide.

### What is not covered

**1. A new feature.**
Anything the site was never built to do. "Can it also send an automatic welcome
email?" is a new feature, not a bug. New features are quoted separately.

**2. A third-party outage.**
If Stripe, Vercel, Supabase, or Microsoft Clarity have their own problems, that
is their outage, not a defect in Kyle's work. Kyle will help you understand what
is happening and tell you when it is fixed. He cannot fix another company's
servers.

**3. A content update.**
Changing words, prices, images, or study materials is a content change. Adding a
testimonial is a content change. These are normal ongoing work, not bugs. Some
are quick; ask Kyle for a quote.

**4. A change in your business.**
If you change your prices, add products, change how you deliver materials, or
change your refund policy, the site may need work to match. That is new work.

**5. Something changed by someone else.**
If another developer edits the code, or if settings are changed in Stripe,
Vercel, or Supabase by anyone other than Kyle, the guarantee does not cover what
follows. Kyle can still help, but as paid work.

**6. Work that was never delivered.**
The guarantee covers what was built. It does not cover things that were agreed to
be built later — such as automatic delivery of study materials — or things that
were explicitly listed as unfinished at handover.

### After 45 days

The guarantee ends. Kyle is still available. Work after that point is quoted
normally. You may want a small monthly arrangement — ask him.

---

## IF SOMETHING LOOKS BROKEN

**1. Do not panic.**
Almost nothing on a website is permanently broken. Your money is safe in Stripe
whatever your website is doing.

**2. Take a screenshot.**
- On a phone: press the power button and the volume-up button together.
- On a Mac: hold **Shift + Command + 4**, then drag a box around the problem.
- On Windows: press the **Windows key + Shift + S**, then drag a box.

**3. Copy the page address from the top of the browser.**
That is the long line of text starting with `https://`. Tap or click it once to
select it, then copy it.

**4. Write down what you clicked right before it happened.**
One sentence is enough. "I clicked Purchase licenses and the page went white."

**5. Send all four things to Kyle.**
The screenshot, the page address, what you clicked, and the time it happened.

That is everything he needs. You do not need to diagnose it. You do not need to
know what caused it. Those four things are the whole job.
