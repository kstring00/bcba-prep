# public/

Static files served at the site root.

## cheat-sheet.pdf — NOT YET ADDED

The /start funnel offers a free **BCBA Domain Cheat Sheet**. The file does not
exist yet.

**To turn it on:**

1. Put the PDF here as `public/cheat-sheet.pdf`.
2. In `lib/funnel/config.ts`, change `CHEAT_SHEET_FILE` from `null` to
   `"/cheat-sheet.pdf"`.
3. Redeploy.

Until then the funnel still works: emails are captured, each lead row records
`delivered = false`, and both the page and the confirmation email say the
sheet is coming rather than promising a download that is not there. Once the
file exists, delivery is immediate and no other change is needed.

To find everyone who signed up during the gap:

```sql
select email, created_at from public.leads where delivered = false
order by created_at;
```

## bryana.jpg — NOT YET ADDED

Bryana's photo, used on /about, /start and the homepage teaser. Portrait crop,
at least 900px on the short edge. Until it exists, a branded honeycomb
fallback renders in its place (see `app/about/FounderPortrait.tsx`).
