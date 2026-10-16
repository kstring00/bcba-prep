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

-- ==========================================================================
-- ONE TRANSACTION. Everything below either applies together or not at all.
-- DDL is transactional in Postgres, so a failure partway through rolls back
-- rather than leaving the table created but still reachable by anon.
-- ==========================================================================
begin;

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

-- Deliberately no grants and no policies for the browser-facing roles.
revoke all on public.leads from anon, authenticated;

-- The service role, explicitly.
--
-- On Supabase this role already holds privileges through the platform's
-- default grants, so this line changes nothing there. It is here so the file
-- does not DEPEND on that: a migration whose correctness rests on a grant
-- made somewhere else, by someone else, is how the testimonials table ended
-- up in a shape no file recorded. app/api/lead/route.ts is the only writer,
-- and this is the grant it needs.
grant all on public.leads to service_role;

-- Drop any policy that exists, by enumeration rather than by name.
--
-- On a fresh database this does nothing: the table is new and has none. It
-- is here because permissive policies OR together, so one policy added later
-- in the dashboard — the "Enable read access for all users" template is one
-- click away — would expose every captured email address, and re-running
-- this file is how someone would expect to undo that. Naming policies to
-- drop cannot protect against a policy nobody wrote down. (0004 learned this
-- the hard way on testimonials.)
--
-- After this block the table has zero policies, which with RLS enabled means
-- anon and authenticated are denied everything.
do $$
declare
  existing record;
begin
  for existing in
    select polname from pg_policy where polrelid = 'public.leads'::regclass
  loop
    execute format('drop policy if exists %I on public.leads', existing.polname);
    raise notice '0003: dropped pre-existing policy "%" on leads.', existing.polname;
  end loop;
end
$$;

commit;

-- --------------------------------------------------------------------------
-- Verification
-- --------------------------------------------------------------------------
-- These are comments, not statements: nothing below runs, so pasting the
-- whole file never produces an expected-error that looks like a failure.
--
-- Zero policies and RLS on is the whole protection. Confirm with:
--   select relrowsecurity from pg_class where relname = 'leads';   -- must be t
--   select count(*) from pg_policy
--     where polrelid = 'public.leads'::regclass;                   -- must be 0
--
-- As an ordinary signed-in user, BOTH of these must fail:
--   select * from public.leads;
--   insert into public.leads (email) values ('probe@example.com');
--
-- Reading the list: Supabase dashboard → Table Editor → leads, or
--   select email, utm_source, utm_campaign, device, delivered, created_at
--   from public.leads order by created_at desc;
