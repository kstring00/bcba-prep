-- ==========================================================================
-- Verifying 0004_testimonials_hardening.sql
-- ==========================================================================
--
-- Run this AFTER the migration. Supabase SQL Editor → paste → Run.
--
-- SOME OF THESE ARE SUPPOSED TO FAIL. Three blocks at the bottom must each
-- report "permission denied for table testimonials". That error IS the pass
-- condition — it is the proof that an anonymous caller can no longer read
-- submitter emails or publish to the site without review.
--
-- Run it one block at a time if your editor stops on the first error.
--
-- SAFE AGAINST PRODUCTION: every write is inside a transaction that is
-- ROLLED BACK, and the reads return counts and column names, not anyone's
-- content.
-- ==========================================================================
-- ==========================================================================
-- 4. Check it worked
-- ==========================================================================
-- Run this straight after. Every line should read as described.

-- What shape did we end up with, and is anything still mandatory that the
-- app does not write?
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'testimonials'
order by ordinal_position;

-- Exactly ONE policy must remain. Permissive policies OR together, so a
-- single leftover `using (true)` would expose every pending and rejected
-- row regardless of the policy 0004 creates. Anything other than 1 here
-- means the sweep did not run or something re-added a policy afterwards.
select count(*) as policy_count_MUST_BE_1,
       coalesce(string_agg(polname, ' | ' order by polname), '(none)') as policies
from pg_policy
where polrelid = to_regclass('public.testimonials');

-- Who can do what. There must be NO insert/update/delete row for anon or
-- authenticated, and NO select row naming the `email` column.
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'testimonials'
  and grantee in ('anon', 'authenticated')
order by grantee, privilege_type, column_name;

-- Nothing should be left in limbo: every row is pending, approved, or
-- rejected, and none has a null display_name.
select status, count(*) as rows,
       count(*) filter (where display_name is null) as null_display_name_MUST_BE_0
from public.testimonials
group by status
order by status;

-- ==========================================================================
-- 5. The three things that must now FAIL
-- ==========================================================================
-- The SQL Editor runs as a superuser and BYPASSES RLS, so these must be run
-- with the role set explicitly or they will wrongly appear to succeed.
-- Each is wrapped in a transaction that rolls back, so nothing is written.

-- (a) reading submitter emails — EXPECT: permission denied
begin;
  set local role anon;
  select email from public.testimonials limit 5;
rollback;

-- (b) self-publishing — EXPECT: permission denied
begin;
  set local role anon;
  insert into public.testimonials (display_name, email, quote, status)
  values ('attacker', 'a@b.com', 'self published without any review at all', 'approved');
rollback;

-- (c) approving an existing row — EXPECT: permission denied
begin;
  set local role anon;
  update public.testimonials set status = 'approved';
rollback;

-- And the one that must still WORK: a visitor reading the wall.
begin;
  set local role anon;
  select id, display_name, quote, created_at from public.testimonials;
rollback;
