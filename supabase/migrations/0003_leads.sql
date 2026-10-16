-- ==========================================================================
-- 0003 — /start funnel: captured leads
-- ==========================================================================
--
-- APPLY THIS BY HAND, after 0002. Supabase SQL Editor → paste → Run.
-- Idempotent: safe to re-run.
--
-- ──────────────────────────────────────────────────────────────────────────
-- WHY THIS TABLE HAS NO POLICIES
-- ──────────────────────────────────────────────────────────────────────────
-- A lead is captured by a visitor who is NOT signed in, so there is no user
-- token to act as and nothing for RLS to scope rows to.
--
-- The answer is NOT a public insert policy — that would let anyone POST
-- straight to /rest/v1/leads with the publishable key (which ships in the
-- browser bundle) and fill the table, or page through everyone's email
-- addresses.
--
-- Instead: RLS is ON with NO policies at all, which denies every request made
-- with the anon or authenticated key. The only way in is app/api/lead/route.ts
-- using the service-role key, after it has validated the submission. The list
-- is read in the Supabase dashboard, which also uses the service role.
-- ==========================================================================

create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  -- What they asked for. One table rather than one per magnet, so a second
  -- lead magnet later is a new value here, not a migration.
  source text not null default 'cheat-sheet',

  -- Attribution, captured from the landing URL. All nullable: most visits
  -- arrive with no UTM at all and that is not an error.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  -- document.referrer, for traffic that carries no UTM.
  referrer text,
  -- Phone vs desktop at capture time, which is the whole premise of the
  -- handoff: most of this traffic is on a phone it cannot study on.
  device text check (device is null or device in ('mobile', 'desktop')),

  -- Whether the magnet was actually delivered, so a capture during the
  -- window where the file does not exist yet is visible rather than silently
  -- indistinguishable from a delivered one.
  delivered boolean not null default false,
  created_at timestamptz not null default now(),

  -- One row per address. A repeat submit updates the existing row instead of
  -- creating a duplicate, so the list stays a list of people.
  unique (email)
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_campaign_idx on public.leads (utm_campaign, created_at desc);

alter table public.leads enable row level security;

-- Deliberately no grants and no policies. See the header.
revoke all on public.leads from anon, authenticated;

-- --------------------------------------------------------------------------
-- Verification
-- --------------------------------------------------------------------------
-- As an ordinary signed-in user, BOTH of these must fail:
--   select * from public.leads;
--   insert into public.leads (email) values ('probe@example.com');
--
-- Reading the list: Supabase dashboard → Table Editor → leads, or
--   select email, utm_source, utm_campaign, device, delivered, created_at
--   from public.leads order by created_at desc;
