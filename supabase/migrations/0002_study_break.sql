-- ==========================================================================
-- 0002 — study break: small wins journal + member preferences
-- ==========================================================================
--
-- APPLY THIS BY HAND, after 0001. Supabase SQL Editor → paste → Run.
-- Idempotent: safe to re-run.
--
-- Unlike the entitlements tables in 0001, these two are written BY THE USER,
-- not by the webhook. So they do get insert/update policies — each one scoped
-- to the caller's own rows, with a `with check` so a row cannot be written
-- under someone else's user_id.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- wins — the small-wins / gratitude journal
-- --------------------------------------------------------------------------
-- Private by design. Nothing in the application displays another person's
-- wins, and the policies below make that structural rather than a convention.
create table if not exists public.wins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 280 matches the client limit. Enforced here too, because the client limit
  -- is a courtesy and this is the guarantee.
  text text not null check (char_length(text) between 1 and 280),
  created_at timestamptz not null default now()
);

create index if not exists wins_user_created_idx
  on public.wins (user_id, created_at desc);

alter table public.wins enable row level security;

grant select, insert, delete on public.wins to authenticated;

drop policy if exists "members read own wins" on public.wins;
create policy "members read own wins"
on public.wins
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "members write own wins" on public.wins;
create policy "members write own wins"
on public.wins
for insert
to authenticated
-- `with check` is the important half: without it a caller could insert a row
-- carrying somebody else's user_id.
with check ((select auth.uid()) = user_id);

drop policy if exists "members delete own wins" on public.wins;
create policy "members delete own wins"
on public.wins
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- No UPDATE policy. A win is a note someone made at a moment; editing it
-- later is not a feature anyone asked for, and leaving it out keeps the
-- surface smaller.

-- --------------------------------------------------------------------------
-- member_preferences — timer settings, per user
-- --------------------------------------------------------------------------
-- One row per member. Signed-out visitors keep the same settings in
-- localStorage instead; see lib/study-break/prefs.ts.
create table if not exists public.member_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  focus_minutes integer not null default 25 check (focus_minutes between 1 and 180),
  break_minutes integer not null default 5 check (break_minutes between 1 and 60),
  long_break_minutes integer not null default 15 check (long_break_minutes between 1 and 120),
  rounds_before_long_break integer not null default 4 check (rounds_before_long_break between 2 and 12),
  sound_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.member_preferences enable row level security;

grant select, insert, update on public.member_preferences to authenticated;

drop policy if exists "members read own preferences" on public.member_preferences;
create policy "members read own preferences"
on public.member_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "members insert own preferences" on public.member_preferences;
create policy "members insert own preferences"
on public.member_preferences
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "members update own preferences" on public.member_preferences;
create policy "members update own preferences"
on public.member_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- --------------------------------------------------------------------------
-- Verification — run as an ordinary signed-in user
-- --------------------------------------------------------------------------
--   select * from public.wins;                      -- only your own rows
--   insert into public.wins (user_id, text)
--     values ('<SOME OTHER USER UUID>', 'test');    -- must be DENIED
--   select * from public.member_preferences;        -- only your own row
