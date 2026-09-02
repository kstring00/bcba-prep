-- ==========================================================================
-- FUTURE ARCHITECTURE ONLY — NOT REQUIRED FOR MVP LAUNCH
-- ==========================================================================
--
-- The current product constraint is finished sellable content + first sales,
-- not member-platform infrastructure. This file is preserved as a proposed
-- future Supabase design so the entitlement model has a documented landing
-- place if/when paid demand makes automated access the actual bottleneck.
--
-- DO NOT apply this schema merely because it exists in the repository.
-- Review it again against current Supabase guidance before any real migration.
-- No BCBA Prep Supabase project is connected by this file.
--
-- CRITICAL AUTHORIZATION RULE:
-- Never authorize purchases, roles, or domain access from user_metadata /
-- raw_user_meta_data. That metadata is user-editable. Authorization must come
-- from trusted database rows / server-derived grants (and proper RLS).
--
-- All public-schema tables below enable RLS. `TO authenticated` alone is not
-- authorization; policies also constrain rows to the current user/entitlement.
-- ==========================================================================

create extension if not exists pgcrypto;

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.member_profiles enable row level security;

grant select, update on public.member_profiles to authenticated;

create policy "members can read own profile"
on public.member_profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "members can update own profile"
on public.member_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  status text not null default 'paid' check (status in ('paid', 'refunded', 'partially_refunded', 'disputed', 'revoked')),
  amount_total integer,
  currency text,
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

grant select on public.purchases to authenticated;

create policy "members can read own purchases"
on public.purchases
for select
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.purchase_items (
  id bigint generated always as identity primary key,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id text not null,
  stripe_price_id text,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

alter table public.purchase_items enable row level security;

grant select on public.purchase_items to authenticated;

create policy "members can read own purchase items"
on public.purchase_items
for select
to authenticated
using (
  exists (
    select 1
    from public.purchases p
    where p.id = purchase_items.purchase_id
      and p.user_id = (select auth.uid())
  )
);

create table if not exists public.entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_slug text not null check (
    domain_slug in (
      'foundations',
      'principles',
      'measurement',
      'experimental-design',
      'ethics',
      'assessment',
      'behavior-change',
      'interventions',
      'supervision'
    )
  ),
  source_purchase_id uuid not null references public.purchases(id) on delete restrict,
  active boolean not null default true,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, domain_slug, source_purchase_id)
);

create index if not exists entitlements_user_domain_active_idx
  on public.entitlements (user_id, domain_slug, active);

alter table public.entitlements enable row level security;

grant select on public.entitlements to authenticated;

create policy "members can read own entitlements"
on public.entitlements
for select
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  domain_slug text not null check (
    domain_slug in (
      'foundations',
      'principles',
      'measurement',
      'experimental-design',
      'ethics',
      'assessment',
      'behavior-change',
      'interventions',
      'supervision'
    )
  ),
  kind text not null check (kind in ('study-guide', 'mock-exam', 'quiz', 'chart', 'lesson', 'flashcards', 'other')),
  slug text not null,
  title text not null,
  description text,
  storage_prefix text not null,
  page_count integer check (page_count is null or page_count > 0),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (domain_slug, slug),
  unique (storage_prefix)
);

create index if not exists materials_domain_published_idx
  on public.materials (domain_slug, is_published, sort_order);

alter table public.materials enable row level security;

grant select on public.materials to authenticated;

create policy "members can read metadata for owned domains"
on public.materials
for select
to authenticated
using (
  is_published
  and exists (
    select 1
    from public.entitlements e
    where e.user_id = (select auth.uid())
      and e.domain_slug = materials.domain_slug
      and e.active = true
  )
);

-- Optional future publishing model. Do not build a testimonials CMS until
-- real permissioned testimonials exist and managing them in code is actually
-- inconvenient.
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  name text not null,
  credential text,
  rating smallint check (rating is null or rating between 1 and 5),
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

grant select on public.testimonials to anon, authenticated;

create policy "published testimonials are public"
on public.testimonials
for select
to anon, authenticated
using (is_published = true);

-- Future private paid-material bucket. This is part of the destination model,
-- not a launch requirement. If this schema is ever applied, re-review the
-- material-delivery design and current Supabase Storage guidance first.
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do update set public = excluded.public;

-- Do not add a broad authenticated SELECT policy on storage.objects for this
-- bucket unless the delivery architecture changes. RLS on public.materials
-- controls metadata visibility; future private bytes should be served only
-- after server-side identity + entitlement checks.

-- Optional helper for future application-side checks. SECURITY INVOKER is
-- deliberate; do not replace it with SECURITY DEFINER to bypass RLS.
create or replace function public.has_domain_entitlement(requested_domain_slug text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.entitlements e
    where e.user_id = (select auth.uid())
      and e.domain_slug = requested_domain_slug
      and e.active = true
  );
$$;

revoke all on function public.has_domain_entitlement(text) from public;
grant execute on function public.has_domain_entitlement(text) to authenticated;
