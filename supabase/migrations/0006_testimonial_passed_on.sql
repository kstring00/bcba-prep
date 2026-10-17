-- ==========================================================================
-- 0006 — testimonials: an optional "passed on" date
-- ==========================================================================
--
-- APPLY THIS BY HAND, after 0004. Supabase SQL Editor → paste → Run.
-- Idempotent, non-destructive: no row is changed and no column is dropped.
--
-- A date someone passed their exam is the single most persuasive thing on a
-- testimonial — it turns "this is nice" into "this worked, recently". It is
-- OPTIONAL on purpose: plenty of people submit while still studying, and a
-- required date would either exclude them or invite a made-up one.
--
-- ──────────────────────────────────────────────────────────────────────────
-- WHY THE GRANT MATTERS AS MUCH AS THE COLUMN
-- ──────────────────────────────────────────────────────────────────────────
-- 0004 deliberately granted SELECT at COLUMN level, listing each readable
-- column by name, so that `email` could be left out and asking for it is a
-- Postgres error rather than something the application must remember to
-- filter. The cost of that design is exactly this: a new column is NOT
-- readable until it is added to the grant.
--
-- Add the column without the grant and the page silently renders no dates,
-- because PostgREST refuses the whole request. Both halves are below.
-- ==========================================================================

begin;

alter table public.testimonials
  add column if not exists passed_on date;

-- A loose sanity bound, not validation. The real check lives in
-- app/api/testimonials/route.ts, which can compare against today; a CHECK
-- constraint cannot, because now() is not immutable. This only stops a typo
-- like 0025-09-15 from being stored as a plausible-looking date.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.testimonials'::regclass
      and conname = 'testimonials_passed_on_sane'
  ) then
    alter table public.testimonials
      add constraint testimonials_passed_on_sane
      check (passed_on is null or passed_on >= date '2000-01-01');
    raise notice '0006: passed_on sanity constraint added.';
  end if;
end
$$;

-- Re-grant the full readable column list, now including passed_on.
-- `email` stays absent, deliberately. Re-granting the whole list rather than
-- adding one column keeps this file a complete statement of what is readable,
-- so the answer is in one place rather than spread across two migrations.
grant select (id, display_name, quote, created_at, status, passed_on)
  on public.testimonials to anon, authenticated;

commit;

-- ==========================================================================
-- Confirm
-- ==========================================================================
-- Readable columns for anon. passed_on present, email ABSENT:
--
--   select column_name from information_schema.column_privileges
--    where table_schema = 'public' and table_name = 'testimonials'
--      and grantee = 'anon' and privilege_type = 'SELECT'
--    order by column_name;
--
-- Still refused, as 0004 established:
--   begin; set local role anon; select email from public.testimonials; rollback;
