-- ==========================================================================
-- 0004 — testimonials: an authoritative definition, and locked-down RLS
-- ==========================================================================
--
-- APPLY THIS BY HAND, after 0001 and 0002. Supabase SQL Editor → paste → Run.
-- Idempotent: safe to re-run. Non-destructive: no column is dropped and no
-- row is deleted.
--
-- NUMBERING: 0003 is taken by 0003_leads.sql on the /start branch. If that
-- branch merges first, apply 0003 before this file. They touch different
-- tables and do not depend on each other.
--
-- ──────────────────────────────────────────────────────────────────────────
-- WHY THIS FILE EXISTS
-- ──────────────────────────────────────────────────────────────────────────
-- The testimonials table was never defined by a migration. The only
-- definition in the repo, supabase/schema.sql, does not match what the
-- application actually uses:
--
--   schema.sql has:  name, is_published, credential, rating, sort_order
--   the route uses:  display_name, email, status, consent_to_publish
--
-- So the live table was created by hand, in a shape no file records, with
-- policies nobody can review. Two problems follow, and this file closes both.
--
-- 1. SELF-PUBLISHING. app/api/testimonials/route.ts wrote rows using the
--    PUBLISHABLE key. That key is NEXT_PUBLIC_ — it ships to every browser.
--    For the route to work at all, `anon` must hold INSERT on this table. But
--    anon holding INSERT means anyone can POST straight to
--    /rest/v1/testimonials and set the columns themselves, including
--    status: 'approved'. The moderation queue was then enforced only by our
--    own route politely setting 'pending' — which an attacker does not use.
--    Nothing below grants anon INSERT; the route now writes with the
--    service-role key, so "nothing publishes without review" becomes
--    structural rather than a convention.
--
-- 2. EMAIL HARVESTING. Submitters give a real email address. A table-wide
--    SELECT grant lets anyone request ?select=email and take the lot. The
--    grant below is COLUMN-LEVEL and deliberately omits `email`: a request
--    for that column is refused by Postgres itself, not filtered by our code.
--
-- The row policy and the column grant are independent limits. The policy
-- decides which ROWS; the grant decides which COLUMNS. Either alone leaves a
-- hole.
--
-- ──────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES TO A TABLE THAT ALREADY EXISTS
-- ──────────────────────────────────────────────────────────────────────────
-- Section 2 exists because the live table may still be in the schema.sql
-- shape. Two things would otherwise break:
--
--   - `name` is NOT NULL with no default. The application only writes
--     `display_name`, so every insert would fail. Section 2 backfills
--     display_name from name and then drops the NOT NULL, rather than
--     dropping the column, so no data is lost.
--
--   - Rows currently public under `is_published = true` would vanish from
--     the site, because the new policy keys on `status = 'approved'`.
--     Section 2 carries them across. This PRESERVES what is already visible;
--     it does not publish anything new.
--
-- On a table that is already in the new shape, section 2 does nothing.
-- ==========================================================================

-- ==========================================================================
-- ONE TRANSACTION. Everything below either applies together or not at all.
--
-- Postgres makes DDL transactional, so a failure halfway through — a typo, a
-- constraint an existing row violates, a lost connection — rolls the whole
-- thing back rather than leaving the table half-migrated with its old
-- policies already dropped. That intermediate state is the dangerous one:
-- policies gone, new policy not yet created, table still granted to anon.
-- ==========================================================================
begin;

create extension if not exists pgcrypto;

-- ==========================================================================
-- 1. The table, for a database that does not have one yet
-- ==========================================================================
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 80),
  -- Never exposed to the browser. See the column grant in section 3.
  email text not null check (char_length(email) between 3 and 320),
  quote text not null check (char_length(quote) between 20 and 1200),
  consent_to_publish boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- 2. Reconcile a hand-made table, whatever shape it is in
-- ==========================================================================
-- Each step checks before it acts, so this is safe to run repeatedly and
-- safe to run on a table that is already correct.

-- 2a. Add anything the application needs that is missing.
alter table public.testimonials
  add column if not exists display_name       text,
  add column if not exists email              text,
  add column if not exists quote              text,
  add column if not exists consent_to_publish boolean not null default false,
  add column if not exists status             text not null default 'pending',
  add column if not exists created_at         timestamptz not null default now();

do $$
begin
  -- 2b. Carry legacy `name` across into `display_name`, then stop it being
  --     required. The column is kept, not dropped: dropping it would destroy
  --     data this migration has no business destroying.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'testimonials'
      and column_name = 'name'
  ) then
    update public.testimonials
       set display_name = name
     where display_name is null
       and name is not null;

    alter table public.testimonials alter column name drop not null;
    raise notice '0004: legacy "name" column backfilled into display_name and made nullable.';
  end if;

  -- 2c. Anything already public under the old flag stays public under the
  --     new one. This preserves the current visible state. It does not
  --     publish anything that is not already on the site today.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'testimonials'
      and column_name = 'is_published'
  ) then
    update public.testimonials
       set status = 'approved'
     where is_published = true
       and status = 'pending';

    alter table public.testimonials alter column is_published drop not null;
    raise notice '0004: rows with is_published = true carried over to status = approved.';
  end if;

  -- 2d. Other legacy NOT NULL columns the application never writes. They all
  --     have defaults, so inserts already succeed, but the defaults are
  --     dropped from being mandatory for clarity.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'testimonials'
      and column_name = 'updated_at'
  ) then
    alter table public.testimonials alter column updated_at drop not null;
  end if;

  -- 2e. Constrain status, if the column was added bare in 2a.
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.testimonials'::regclass
      and conname = 'testimonials_status_check'
  ) then
    alter table public.testimonials
      add constraint testimonials_status_check
      check (status in ('pending', 'approved', 'rejected'));
    raise notice '0004: status check constraint added.';
  end if;
end
$$;

create index if not exists testimonials_status_idx
  on public.testimonials (status, created_at desc);

-- ==========================================================================
-- 3. Privileges and policy — the part that actually closes the hole
-- ==========================================================================
alter table public.testimonials enable row level security;

-- Start from nothing. A previous hand-made grant is revoked rather than
-- assumed away: this file has to be able to FIX a database, not merely
-- describe a clean one.
revoke all on public.testimonials from anon, authenticated;

-- Column-level SELECT. `email` is absent on purpose — asking for it is a
-- Postgres permission error, so no application bug can leak it.
grant select (id, display_name, quote, created_at, status)
  on public.testimonials to anon, authenticated;

-- No INSERT, UPDATE or DELETE for anon or authenticated, deliberately.
-- Submissions go through app/api/testimonials, which writes with the
-- service-role key and hard-codes status = 'pending'. The service role
-- bypasses RLS and needs no policy here.

-- Drop EVERY existing policy on the table, by enumeration rather than by
-- name.
--
-- This is the part that actually decides what is visible. Postgres ORs
-- permissive policies together: one leftover policy of the shape
-- `for select to anon using (true)` — the "Enable read access for all users"
-- template the dashboard offers — grants every pending and rejected row no
-- matter what the policy below says. Naming two known policies and dropping
-- those was no protection at all on a table that was made by hand, because
-- the whole problem is that nobody knows what is on it.
--
-- After this block the table has exactly one policy, and it is the one
-- created immediately below.
do $$
declare
  existing record;
begin
  for existing in
    select polname
    from pg_policy
    where polrelid = 'public.testimonials'::regclass
  loop
    execute format(
      'drop policy if exists %I on public.testimonials', existing.polname
    );
    raise notice '0004: dropped pre-existing policy "%" on testimonials.', existing.polname;
  end loop;
end
$$;

create policy "approved testimonials are public"
on public.testimonials
for select
to anon, authenticated
using (status = 'approved');

commit;

-- ==========================================================================
-- DONE.
--
-- Everything above is inside the single transaction opened at the top, so an
-- error anywhere in it rolls the whole migration back — the table is never
-- left with its old policies dropped and the new one not yet created. Run it
-- again once the cause is fixed; it is idempotent.
--
-- If your SQL editor reports "no transaction in progress" at the COMMIT, it
-- ran each statement in its own transaction. The migration still applied
-- correctly; only the all-or-nothing guarantee was absent.
--
-- The checks, and the three operations that must now be REFUSED, are in
-- supabase/tests/testimonials_verify.sql. They are deliberately in a
-- separate file: some of them are SUPPOSED to raise "permission denied",
-- and an expected error pasted into the middle of a migration is how people
-- come to believe a migration failed when it did not.
-- ==========================================================================
