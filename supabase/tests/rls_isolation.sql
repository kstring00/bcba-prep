-- ==========================================================================
-- RLS ISOLATION TESTS — run in the Supabase SQL Editor
-- ==========================================================================
--
-- Proves, per table, that user A cannot reach user B's rows and that an
-- anonymous caller gets nothing private.
--
-- HOW IT WORKS
-- Supabase's SQL Editor runs as a superuser, which BYPASSES RLS — running a
-- plain `select` there proves nothing. Each block below therefore sets the
-- role and the JWT claims explicitly, so the policies actually apply. That
-- distinction is the whole point: a test that cannot fail is not a test.
--
-- SAFE TO RUN AGAINST PRODUCTION. Every block is wrapped in a transaction
-- that is ROLLED BACK, so nothing is written and nothing is deleted. It reads
-- only row COUNTS, never anyone's content.
--
-- SETUP: create two throwaway accounts through the website's own sign-up
-- form, then put their ids here. Get them with:
--   select id, email from auth.users order by created_at desc limit 5;
-- ==========================================================================

\set user_a '00000000-0000-0000-0000-00000000000a'
\set user_b '00000000-0000-0000-0000-00000000000b'

-- If your SQL editor does not support \set, replace :'user_a' and :'user_b'
-- below with the two uuids in single quotes.

-- --------------------------------------------------------------------------
-- Helper: become a given user for the rest of the transaction
-- --------------------------------------------------------------------------
-- set_config('request.jwt.claims', ...) is what auth.uid() reads.

-- ==========================================================================
-- TEST 1 — entitlements: A sees only A's
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub', :'user_a', 'role', 'authenticated')::text, true);

  select 'entitlements: rows visible to A' as test,
         count(*) as visible,
         count(*) filter (where user_id <> :'user_a'::uuid) as foreign_rows_MUST_BE_0
  from public.entitlements;
rollback;

-- ==========================================================================
-- TEST 2 — purchases: A sees only A's
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub', :'user_a', 'role', 'authenticated')::text, true);

  select 'purchases: rows visible to A' as test,
         count(*) as visible,
         count(*) filter (where user_id <> :'user_a'::uuid) as foreign_rows_MUST_BE_0
  from public.purchases;
rollback;

-- ==========================================================================
-- TEST 3 — wins: the private journal. A must not see B's, and must not be
--          able to write a row under B's id.
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub', :'user_a', 'role', 'authenticated')::text, true);

  select 'wins: rows visible to A' as test,
         count(*) as visible,
         count(*) filter (where user_id <> :'user_a'::uuid) as foreign_rows_MUST_BE_0
  from public.wins;
rollback;

-- Forged user_id. EXPECTED: "new row violates row-level security policy".
-- If this INSERT succeeds, the `with check` on the wins insert policy is
-- missing and anyone can write entries into another member's journal.
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub', :'user_a', 'role', 'authenticated')::text, true);

  insert into public.wins (user_id, text) values (:'user_b'::uuid, 'forged by A');
rollback;

-- ==========================================================================
-- TEST 4 — member_preferences: same, for the settings row
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub', :'user_a', 'role', 'authenticated')::text, true);

  select 'member_preferences: rows visible to A' as test,
         count(*) as visible,
         count(*) filter (where user_id <> :'user_a'::uuid) as foreign_rows_MUST_BE_0
  from public.member_preferences;
rollback;

-- ==========================================================================
-- TEST 5 — content_items: metadata for OWNED skus only
-- ==========================================================================
-- A non-owner must not be able to enumerate even the titles of what they have
-- not bought.
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub', :'user_a', 'role', 'authenticated')::text, true);

  select 'content_items: visible to A' as test,
         count(*) as visible,
         count(*) filter (
           where not exists (
             select 1 from public.entitlements e
             where e.user_id = :'user_a'::uuid
               and e.sku = content_items.sku
               and e.active
           )
         ) as unowned_rows_MUST_BE_0
  from public.content_items;
rollback;

-- ==========================================================================
-- TEST 6 — webhook_events: nobody but the service role
-- ==========================================================================
begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub', :'user_a', 'role', 'authenticated')::text, true);

  select 'webhook_events: visible to a member' as test,
         count(*) as rows_MUST_BE_0
  from public.webhook_events;
rollback;

-- ==========================================================================
-- TEST 7 — testimonials: approved rows only, and email unreadable
-- ==========================================================================
begin;
  set local role anon;
  select set_config('request.jwt.claims',
    json_build_object('role', 'anon')::text, true);

  select 'testimonials: visible to anon' as test,
         count(*) as visible,
         count(*) filter (where status <> 'approved') as unapproved_MUST_BE_0
  from public.testimonials;
rollback;

-- EXPECTED after 0004: "permission denied for table testimonials".
-- Before 0004 this returns every submitter's email address.
begin;
  set local role anon;
  select set_config('request.jwt.claims',
    json_build_object('role', 'anon')::text, true);

  select email from public.testimonials limit 5;
rollback;

-- EXPECTED after 0004: "permission denied for table testimonials".
-- Before 0004 this publishes a testimonial to the live site without review.
begin;
  set local role anon;
  select set_config('request.jwt.claims',
    json_build_object('role', 'anon')::text, true);

  insert into public.testimonials (display_name, email, quote, status)
  values ('attacker', 'a@b.com', 'self published without review, twenty chars plus', 'approved');
rollback;

-- ==========================================================================
-- TEST 8 — leads: the email list. Nothing reads it but the service role.
-- ==========================================================================
-- Only applies once 0003_leads.sql is applied (the /start branch).
-- EXPECTED: "permission denied for table leads" in BOTH blocks.
begin;
  set local role anon;
  select set_config('request.jwt.claims', json_build_object('role','anon')::text, true);
  select count(*) from public.leads;
rollback;

begin;
  set local role authenticated;
  select set_config('request.jwt.claims',
    json_build_object('sub', :'user_a', 'role', 'authenticated')::text, true);
  select count(*) from public.leads;
rollback;

-- ==========================================================================
-- TEST 9 — anonymous callers get nothing private, across the board
-- ==========================================================================
-- Every count here MUST be 0.
begin;
  set local role anon;
  select set_config('request.jwt.claims', json_build_object('role','anon')::text, true);

  select 'anon sees entitlements' as test, count(*) as must_be_0 from public.entitlements
  union all
  select 'anon sees purchases',            count(*) from public.purchases
  union all
  select 'anon sees wins',                 count(*) from public.wins
  union all
  select 'anon sees member_preferences',   count(*) from public.member_preferences
  union all
  select 'anon sees content_items',        count(*) from public.content_items
  union all
  select 'anon sees webhook_events',       count(*) from public.webhook_events;
rollback;

-- ==========================================================================
-- TEST 10 — RLS is actually ENABLED everywhere it should be
-- ==========================================================================
-- A policy on a table with RLS switched off does nothing at all. rowsecurity
-- must be true for every row returned here.
select tablename, rowsecurity as rls_enabled_MUST_BE_TRUE
from pg_tables
where schemaname = 'public'
  and tablename in ('entitlements','purchases','wins','member_preferences',
                    'content_items','webhook_events','testimonials','leads')
order by tablename;

-- ==========================================================================
-- TEST 11 — no table is missing a policy while RLS is on in a way that
--           silently grants access through a broad GRANT
-- ==========================================================================
select
  c.relname as table_name,
  c.relrowsecurity as rls_on,
  coalesce(count(p.polname), 0) as policy_count,
  array_agg(p.polname) filter (where p.polname is not null) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public' and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relname;

-- ==========================================================================
-- TEST 12 — the storage bucket holding paid files must be private
-- ==========================================================================
select id, public as public_MUST_BE_FALSE
from storage.buckets
where id = 'materials';
