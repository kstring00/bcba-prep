-- ==========================================================================
-- 0004 — testimonials: an authoritative definition, and locked-down RLS
-- ==========================================================================
--
-- APPLY THIS BY HAND, after 0001 and 0002. Supabase SQL Editor → paste → Run.
-- Idempotent: safe to re-run.
--
-- NUMBERING: 0003 is taken by 0003_leads.sql on the /start branch. If that
-- branch merges first, apply 0003 before this file. The two touch different
-- tables and do not depend on each other.
--
-- ──────────────────────────────────────────────────────────────────────────
-- WHY THIS FILE EXISTS
-- ──────────────────────────────────────────────────────────────────────────
-- The testimonials table was never defined by a migration. The only
-- definition in the repo was in supabase/schema.sql, and it does not match
-- what the application actually uses:
--
--   schema.sql has:  name, is_published, credential, rating, sort_order
--   the route uses:  display_name, email, status, consent_to_publish
--
-- So the live table was created by hand, in a shape no file records, with
-- policies nobody can review. Two problems follow from that, and this file
-- closes both.
--
-- 1. SELF-PUBLISHING. app/api/testimonials/route.ts wrote rows using the
--    PUBLISHABLE key. That key is NEXT_PUBLIC_ — it ships to every browser.
--    For the route to work at all, `anon` must hold INSERT on this table. But
--    `anon` holding INSERT means anyone can POST straight to
--    /rest/v1/testimonials and set the columns themselves, including
--    status: 'approved'. The moderation queue would then be enforced only by
--    our own route politely setting 'pending' — which an attacker simply does
--    not use. Nothing below grants anon INSERT; the route now writes with the
--    service-role key instead, so "nothing publishes without review" becomes
--    structural rather than a convention.
--
-- 2. EMAIL HARVESTING. Submitters give a real email address. A table-wide
--    SELECT grant would let anyone request ?select=email and take the lot.
--    The grant below is COLUMN-LEVEL and deliberately omits `email`: a
--    request for that column is rejected by Postgres itself, not filtered by
--    our code.
--
-- The `using (status = 'approved')` policy and the column grant are two
-- independent limits. The policy decides which ROWS; the grant decides which
-- COLUMNS. Either alone leaves a hole.
-- ==========================================================================

create extension if not exists pgcrypto;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 1 and 80),
  -- Never exposed to the browser. See the column grant below.
  email text not null check (char_length(email) between 3 and 320),
  quote text not null check (char_length(quote) between 20 and 1200),
  consent_to_publish boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Tolerate a hand-made table that predates this file: add anything missing
-- rather than failing, so this can be run against the existing database.
alter table public.testimonials
  add column if not exists display_name text,
  add column if not exists email text,
  add column if not exists quote text,
  add column if not exists consent_to_publish boolean not null default false,
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now();

create index if not exists testimonials_status_idx
  on public.testimonials (status, created_at desc);

alter table public.testimonials enable row level security;

-- --------------------------------------------------------------------------
-- Privileges
-- --------------------------------------------------------------------------
-- Start from nothing. A previous hand-made grant is revoked rather than
-- assumed away: this file has to be able to FIX a database, not just describe
-- a clean one.
revoke all on public.testimonials from anon, authenticated;

-- Column-level SELECT. `email` is absent on purpose — asking for it is a
-- Postgres permission error, so no application bug can leak it.
grant select (id, display_name, quote, created_at, status)
  on public.testimonials to anon, authenticated;

-- No INSERT, UPDATE or DELETE for anyone but the service role. Submissions
-- come through app/api/testimonials, which writes with the service-role key
-- and forces status = 'pending'.

drop policy if exists "published testimonials are public" on public.testimonials;
drop policy if exists "approved testimonials are public" on public.testimonials;
create policy "approved testimonials are public"
on public.testimonials
for select
to anon, authenticated
using (status = 'approved');

-- --------------------------------------------------------------------------
-- Verification — paste into the SQL editor, or run from a browser session
-- --------------------------------------------------------------------------
-- As anon (or any signed-in member):
--
--   select id, display_name, quote from public.testimonials;
--     -> only rows whose status is 'approved'
--
--   select email from public.testimonials;
--     -> ERROR: permission denied for table testimonials
--
--   insert into public.testimonials (display_name, email, quote, status)
--     values ('attacker', 'a@b.com', 'self published', 'approved');
--     -> ERROR: permission denied for table testimonials
--
--   update public.testimonials set status = 'approved';
--     -> ERROR: permission denied for table testimonials
