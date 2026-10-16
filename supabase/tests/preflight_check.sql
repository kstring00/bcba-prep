-- ==========================================================================
-- PREFLIGHT — read-only. Run this BEFORE applying 0004.
-- ==========================================================================
-- Creates nothing, changes nothing, deletes nothing. Two selects.
--
-- The first answers: are 0001 and 0002 applied? Every row should say "yes".
-- A "NO" on any 0001 or 0002 row means apply that migration first — 0004
-- does not depend on them, but the application does.
--
-- The second answers: which shape is the testimonials table in, and is the
-- hole actually open on THIS database?
--
--   anon_can_insert     = yes  a stranger can publish to the site today
--   anon_can_read_email = yes  submitter emails are readable by anyone
--
-- Both must read "no" after 0004. Verified against PostgreSQL 16 on an empty
-- database, on one with 0001+0002+a vulnerable table, and on the same
-- database after 0004.
select
  step,
  object,
  case when present then 'yes' else 'NO  <-- missing' end as applied
from (
  select '0001' as step, 'table: purchases'            as object, to_regclass('public.purchases')      is not null as present
  union all select '0001', 'table: entitlements',        to_regclass('public.entitlements')     is not null
  union all select '0001', 'table: content_items',       to_regclass('public.content_items')    is not null
  union all select '0001', 'table: webhook_events',      to_regclass('public.webhook_events')   is not null
  union all select '0001', 'function: is_valid_sku',
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname = 'is_valid_sku')
  union all select '0001', 'function: owns_sku',
    exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname = 'owns_sku')
  union all select '0001', 'storage bucket: materials (private)',
    exists (select 1 from storage.buckets where id = 'materials' and public = false)
  union all select '0002', 'table: wins',                to_regclass('public.wins')             is not null
  union all select '0002', 'table: member_preferences',  to_regclass('public.member_preferences') is not null
  union all select '0004', 'table: testimonials (exists at all)',
                                                          to_regclass('public.testimonials')     is not null
) t
order by step, object;

-- Which shape is the testimonials table in, and is the hole open?
-- `anon_can_insert = yes` means a stranger can publish to the site today.
select
  coalesce((select string_agg(column_name, ', ' order by ordinal_position)
            from information_schema.columns
            where table_schema = 'public' and table_name = 'testimonials'),
           '(no testimonials table)')                                   as columns_present,
  coalesce((select bool_or(c.relrowsecurity) from pg_class c
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname='public' and c.relname='testimonials'), false) as rls_enabled,
  case when exists (
    select 1 from information_schema.role_table_grants
    where table_schema='public' and table_name='testimonials'
      and grantee='anon' and privilege_type='INSERT'
  ) and exists (
    select 1 from pg_policy p
    where p.polrelid = to_regclass('public.testimonials') and p.polcmd in ('a','*')
  ) then 'yes  <-- strangers can publish' else 'no' end                 as anon_can_insert,
  case when exists (
    select 1 from information_schema.column_privileges
    where table_schema='public' and table_name='testimonials'
      and grantee='anon' and column_name='email' and privilege_type='SELECT'
  ) then 'yes  <-- submitter emails readable' else 'no' end             as anon_can_read_email;
