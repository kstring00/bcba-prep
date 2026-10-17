-- ==========================================================================
-- 0007 — Mental Health Toolkit: anonymous "how are you feeling?" taps
-- ==========================================================================
--
-- APPLY THIS BY HAND. Supabase SQL Editor → paste → Run. Idempotent.
--
-- WHAT THIS STORES, AND WHAT IT NEVER STORES.
--
--   A tap is one of six fixed feelings, the UTC day it happened, and a
--   SHA-256 of a random id the browser made up for itself and keeps in
--   localStorage. That is all. No user id, no email, no name, no IP, no
--   free text, no user agent. The hash exists only so that one device
--   counts once per day; it cannot be reversed into anything, and it is
--   not joined to any other table.
--
--   Counts are shown on the page only above a threshold (see
--   lib/toolkit/config.ts), so a single tap is never visible as "1 person".
--
-- ACCESS. Nobody but the service role touches this table. anon and
-- authenticated have no grants and there are no policies, so the only path
-- in is app/api/toolkit/checkin/route.ts, which rate-limits and validates.
-- RLS is enabled anyway, so a future grant would still hit a closed door.
-- ==========================================================================

begin;

create table if not exists public.toolkit_checkins (
  id uuid primary key default gen_random_uuid(),
  feeling text not null check (
    feeling in (
      'burnt-out',
      'overwhelmed',
      'tired',
      'dreading-a-session',
      'failed-my-exam',
      'doing-okay'
    )
  ),
  -- The UTC calendar day. One row per (day, device): the unique constraint
  -- below is what makes "one tap per device per day" a guarantee rather
  -- than a client courtesy. A second tap the same day replaces the first.
  day date not null default (timezone('utc', now()))::date,
  -- 64 hex characters: SHA-256 of a random browser-generated id.
  device_hash text not null check (device_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (day, device_hash)
);

create index if not exists toolkit_checkins_day_feeling_idx
  on public.toolkit_checkins (day, feeling);

alter table public.toolkit_checkins enable row level security;

-- Closed to every API role. Service role bypasses RLS and needs no grant.
revoke all on public.toolkit_checkins from anon, authenticated;

-- Sweep any policy that might exist from an earlier draft; there should be
-- none, and after this there are none.
do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'toolkit_checkins'
  loop
    execute format('drop policy if exists %I on public.toolkit_checkins', p.policyname);
  end loop;
end
$$;

-- --------------------------------------------------------------------------
-- The one thing the page reads: taps per feeling over the last seven days.
-- A view, because PostgREST aggregates are off by default on Supabase and
-- the app should not need them on. security_invoker means the view runs
-- with the caller's rights, so anon could not use it even if it were granted.
-- --------------------------------------------------------------------------
create or replace view public.toolkit_checkin_counts
with (security_invoker = true) as
  select feeling, count(*)::int as taps
  from public.toolkit_checkins
  where day >= (timezone('utc', now()))::date - 6
  group by feeling;

revoke all on public.toolkit_checkin_counts from anon, authenticated;

commit;
