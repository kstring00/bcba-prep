-- ==========================================================================
-- 0005 — leads.source default follows the funnel
-- ==========================================================================
--
-- APPLY THIS BY HAND, after 0003. Supabase SQL Editor → paste → Run.
-- Idempotent, non-destructive: no row is changed and no column is dropped.
--
-- /start was a cheat-sheet download and is now a founding-member waitlist.
-- 0003 set the column default to 'cheat-sheet', which is now the name of
-- something that does not exist.
--
-- This is cosmetic TODAY, because app/api/lead/route.ts always sends `source`
-- explicitly and never relies on the default. It is worth fixing anyway: the
-- next person to insert a row by hand, or from the dashboard, or from a
-- script written in six months, gets the default — and a row labelled
-- 'cheat-sheet' in a table of waitlist signups is a small lie that will be
-- believed.
--
-- EXISTING ROWS ARE LEFT ALONE. Anyone who signed up for the cheat sheet
-- genuinely did sign up for the cheat sheet; rewriting their row would
-- destroy the only record of what they were actually offered. If any exist,
-- they are worth a personal note rather than a silent relabel:
--
--   select email, created_at from public.leads
--    where source = 'cheat-sheet' order by created_at;
-- ==========================================================================

begin;

alter table public.leads alter column source set default 'founding-waitlist';

commit;

-- Confirm:
--   select column_default from information_schema.columns
--    where table_schema = 'public' and table_name = 'leads'
--      and column_name = 'source';
--   -> 'founding-waitlist'::text
