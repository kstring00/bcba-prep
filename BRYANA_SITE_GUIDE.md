# Your Website — The Owner's Guide

**For Bryana Utley · BCBA Prep by Bee the Behavior Bae**

This guide is written so you never need to understand code.

You will see the words **ASK KYLE** in bold. That means the task needs a
developer. It is not something you did wrong. Some things simply require code.

This guide describes what your website does **today**. Where the real process is
clunky, this guide says so. It will not pretend something is easy when it is not.

---

## ⚠️ READ THIS FIRST

**Your website is not ready to sell yet.**

Right now, if a stranger paid you $179 tonight, here is exactly what would
happen:

1. Their money would go through. Stripe would take the payment.
2. They would get a receipt email from Stripe.
3. They would land on a "Thank you" page that shows broken text.
4. **Nobody would tell you the sale happened.**
5. **They would receive no study materials, because none have been added yet.**

None of this is a surprise or a mistake. The website was built first, and the
study materials come next. But it does mean: **do not turn on sales yet.**

Kyle has a list of what must be fixed first. Ask him for the "launch blockers"
list. When those are done, this warning goes away.

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

Here is the trip a customer takes. Numbers 1 through 6 work today. **Number 7
does not exist yet.**

1. They open your website.
2. They see nine books stacked up. Each book is one exam domain.
3. They click a book. It opens to a page for that domain.
4. They click **Add domain license**. A little book flies into the cart.
5. They click the cart. They see their total. If they picked 3 domains, the
   price drops to $75 by itself. If they picked 5, it drops to $115. If they
   picked 8 or 9, it drops to $179.
6. They click **Purchase licenses**. Stripe's payment page opens. They type their
   card number **on Stripe's page, never on yours.**
7. **They get their study materials.** ← **This step does not exist.**

**What actually happens at step 7 today:** They see a "Thank you" page with
broken text on it. They get a receipt email from Stripe. Nothing else happens.
No materials are sent. You are not told.

**Until Kyle fixes this, you must not sell anything.**

### About the prices

Your prices are set. They work correctly. Kyle tested every combination.

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
someone picks 8, the website gives them all 9 for the same price. That is a nice
surprise for them and it is working correctly.

**Nobody can cheat the price.** Kyle checked this carefully. A customer cannot
change the amount using their browser. The price is decided on your side, not
theirs.

---

## HOW TO CHECK A SALE

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
- The site has a **Forgot password?** link on the sign-in page. It sends them an
  email.
- 🔴 **The link in that email does not work.** The page it points to was never
  built. **This is broken today.**
- **What to do right now:** Apologize. Tell them you will help another way. Then
  **ASK KYLE** — he can reset a password by hand.
- Kyle is fixing this. Once it is fixed, delete this warning from your guide.

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

**What you can do today:** Keep your study materials on your own computer, or in
Google Drive or Dropbox. When someone buys, email them the files yourself.

**What must happen for the website to hold your materials:** **ASK KYLE.** This
is real development work — building storage, and building the system that gives
each customer only the domains they paid for. It is a project, not a setting.

**Do not let anyone tell you this is a quick fix.** It is not.

---

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

**You cannot add one yourself. You also cannot approve or delete one yourself.**

**Here is how it works today:**

1. A student goes to your **Testimonials** page.
2. They scroll down and fill in the form: their name, their email, and what they
   want to say.
3. They tick a box saying you may publish it.
4. They click submit.

**Then what?** Their note is saved. That part works.

🔴 **But there is a serious problem you must know about.**

Your Testimonials page says, in writing:

> *"Every testimonial below is reviewed before it is published."*

**That is not true right now.** The website does not hold notes back for you to
approve. There is no approve button anywhere, and no screen where you could see
waiting notes.

**What this means:** if the page starts showing notes, it will show them **the
instant they are submitted** — including anything a stranger types into that
form. Up to 1,200 characters, under any name they choose, on your website.

**What to do:** **ASK KYLE to fix this before you tell anyone about the
testimonials page.** He needs to build the approve step, and correct the sentence
that promises review.

**Until it is fixed:** Do not share a link to your testimonials page. Do not ask
students to leave a note there.

---

## HOW TO CHECK CONTACT MESSAGES

🔴 **This is broken today. Please read this whole section.**

Your **Contact** page has a form. Customers fill it in and click send. They see a
friendly message saying it went through.

**Where does the message go?**

It goes into the Supabase filing cabinet. It sits in a table called
`contact_messages`.

**And then:**

- ❌ **You do not get an email.**
- ❌ **You do not get a notification.**
- ❌ **There is no inbox to open.**
- ❌ **Nothing on your website shows you these messages.**

The Contact page even tells customers *"Bee can review it from the BCBA Prep
contact inbox."* **There is no inbox.** That sentence is not true.

**Why this is serious:** the people most likely to use that form are customers
with a payment or access problem. They will write to you, see a success message,
and hear nothing back. That is how refunds and bad reviews start.

**What to do right now:**

1. **ASK KYLE to fix this.** Messages should arrive in your real email inbox.
   This is straightforward work — a few hours.
2. **Until then, do not send anyone to the Contact page.** Put your real email
   address on the page instead, and let people write to you directly.

**If you must read the stored messages before Kyle fixes it:** **ASK KYLE** to
pull them out for you. Do not try to dig through Supabase yourself.

---

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
  as text in double square brackets.
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

For the first seven days after your site goes live, Kyle is on call. Here is the
checklist to walk through together during week one.

**Day 1 — Together, on a call**

- [ ] Sign in to Stripe together. Bryana signs in herself, not Kyle.
- [ ] Confirm the bank account in Stripe is Bryana's.
- [ ] Confirm the tax details in Stripe are Bryana's.
- [ ] Run one real test purchase, for real money, on a real card.
- [ ] Find that payment in the Stripe dashboard together.
- [ ] Find the `entitlement_slugs` line together.
- [ ] Refund that test purchase together, click by click.
- [ ] Set up the sales spreadsheet: Date · Email · Domains · Sent?

**Day 2 — Fulfilment practice**

- [ ] Practise the full manual delivery: find the sale, copy the email, send the
      files, tick the spreadsheet.
- [ ] Write a saved email template so it is the same every time.
- [ ] Agree how fast you promise to deliver. Put that promise on the site.

**Day 3 — Customer problems**

- [ ] Walk the "cannot log in" decision tree together.
- [ ] Confirm the password reset actually works now.
- [ ] Confirm contact messages actually reach Bryana's real email inbox.
- [ ] Send a test message through the contact form and watch it arrive.

**Day 4 — Watching**

- [ ] Sign in to Clarity together.
- [ ] Look at the four numbers that matter.
- [ ] Watch one session recording together.

**Day 5 — Checking the site itself**

- [ ] Open every page on a phone.
- [ ] Confirm no broken code words are visible anywhere.
- [ ] Confirm the testimonials page behaves the way Bryana expects.
- [ ] Confirm every legal page reads correctly.

**Day 6 — Emergency drill**

- [ ] Practise the "something is broken" steps at the end of this guide.
- [ ] Save Kyle's contact details in Bryana's phone.
- [ ] Agree what counts as an emergency and what can wait.

**Day 7 — Handover**

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
