-- ==========================================================================
-- 0001 — purchases, entitlements, content, protected storage
-- ==========================================================================
--
-- APPLY THIS BY HAND. Supabase SQL Editor → paste → Run.
-- It has NOT been applied by the change that added it.
--
-- Safe to re-run: every statement is idempotent (`if not exists`, or a
-- drop-then-create for policies). Running it twice changes nothing.
--
-- ──────────────────────────────────────────────────────────────────────────
-- THE AUTHORIZATION RULE THIS FILE EXISTS TO ENFORCE
-- ──────────────────────────────────────────────────────────────────────────
-- Ownership is proven by a row in `entitlements`, written only by the Stripe
-- webhook using the service-role key, after Stripe has verified the payment.
--
-- Never authorize from `user_metadata` / `raw_user_meta_data`: that is
-- user-editable, so a customer could grant themselves the whole library.
-- Never authorize from anything the browser sent.
--
-- Every table below enables RLS. `to authenticated` alone is NOT
-- authorization — each policy also constrains rows to the calling user.
-- There is no INSERT/UPDATE/DELETE policy for `authenticated` on purchases or
-- entitlements at all: clients may read their own rows and nothing more. The
-- service-role key bypasses RLS, which is why it must never reach the browser.
-- ==========================================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- SKU vocabulary
-- --------------------------------------------------------------------------
-- Namespaced to keep domains and exams in one ownership model:
--   domain:<slug>   the nine BACB domains
--   exam:<id>       mock exams
-- Mirrors lib/catalog.ts. Change both together.
create or replace function public.is_valid_sku(sku text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select sku ~ '^domain:[a-z0-9-]+$' or sku ~ '^exam:[a-z0-9-]+$';
$$;

-- --------------------------------------------------------------------------
-- webhook_events — idempotency
-- --------------------------------------------------------------------------
-- Stripe delivers the same event more than once; retries are normal, not
-- exceptional. The webhook inserts here FIRST and treats a unique violation
-- as "already handled, stop". That is what makes a replay a no-op instead of
-- a second grant.
create table if not exists public.webhook_events (
  event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.webhook_events enable row level security;
-- No policies: service-role only. Clients have no business reading this.

-- --------------------------------------------------------------------------
-- purchases — one row per completed Stripe Checkout Session
-- --------------------------------------------------------------------------
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  status text not null default 'paid'
    check (status in ('paid', 'refunded', 'partially_refunded', 'disputed', 'revoked')),
  amount_total integer,
  currency text,
  purchaser_email text,
  created_at timestamptz not null default now()
);

create index if not exists purchases_user_idx on public.purchases (user_id, created_at desc);

alter table public.purchases enable row level security;
grant select on public.purchases to authenticated;

drop policy if exists "members read own purchases" on public.purchases;
create policy "members read own purchases"
on public.purchases
for select
to authenticated
using ((select auth.uid()) = user_id);

-- --------------------------------------------------------------------------
-- entitlements — the ownership record. This table IS access control.
-- --------------------------------------------------------------------------
create table if not exists public.entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sku text not null check (public.is_valid_sku(sku)),
  source_purchase_id uuid references public.purchases(id) on delete restrict,
  active boolean not null default true,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  -- One grant per SKU per person. Re-buying the same thing must not create a
  -- second row, and this is the constraint the webhook's upsert targets.
  unique (user_id, sku)
);

create index if not exists entitlements_lookup_idx
  on public.entitlements (user_id, active, sku);

alter table public.entitlements enable row level security;
grant select on public.entitlements to authenticated;

drop policy if exists "members read own entitlements" on public.entitlements;
create policy "members read own entitlements"
on public.entitlements
for select
to authenticated
using ((select auth.uid()) = user_id);

-- --------------------------------------------------------------------------
-- content_items — what a SKU actually delivers
-- --------------------------------------------------------------------------
-- `kind` carries the file-or-interactive decision in data:
--   'file'        a document in the private `materials` bucket.
--   'interactive' an in-browser exam. NOT BUILT — reserved so adding it later
--                 needs no migration.
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  sku text not null check (public.is_valid_sku(sku)),
  kind text not null default 'file' check (kind in ('file', 'interactive')),
  title text not null,
  description text,
  -- Path inside the private `materials` bucket. Required for 'file' content,
  -- meaningless for 'interactive'.
  storage_path text,
  page_count integer check (page_count is null or page_count > 0),
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_file_needs_path
    check (kind <> 'file' or storage_path is not null)
);

create unique index if not exists content_items_storage_path_idx
  on public.content_items (storage_path) where storage_path is not null;

create index if not exists content_items_sku_idx
  on public.content_items (sku, is_published, sort_order);

alter table public.content_items enable row level security;
grant select on public.content_items to authenticated;

-- Metadata for owned SKUs only. A non-owner cannot even enumerate the titles
-- of what they have not bought.
drop policy if exists "members read content for owned skus" on public.content_items;
create policy "members read content for owned skus"
on public.content_items
for select
to authenticated
using (
  is_published
  and exists (
    select 1
    from public.entitlements e
    where e.user_id = (select auth.uid())
      and e.sku = content_items.sku
      and e.active = true
  )
);

-- --------------------------------------------------------------------------
-- Ownership helper
-- --------------------------------------------------------------------------
-- SECURITY INVOKER is deliberate: it runs as the caller, so RLS still
-- applies. Do not switch it to SECURITY DEFINER to "make it work" — that
-- would turn it into a way to read anyone's entitlements.
create or replace function public.owns_sku(requested_sku text)
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
      and e.sku = requested_sku
      and e.active = true
  );
$$;

revoke all on function public.owns_sku(text) from public;
grant execute on function public.owns_sku(text) to authenticated;

-- --------------------------------------------------------------------------
-- Private storage for paid files
-- --------------------------------------------------------------------------
-- public = false. The bytes are reachable only through a short-lived signed
-- URL, minted server-side in app/api/content/[id]/route.ts AFTER that route
-- has checked the session and the entitlement.
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do update set public = false;

-- NO storage.objects SELECT policy for `authenticated` is created here, and
-- none should be added. A broad policy would let any signed-in user read any
-- object in the bucket by guessing paths, which is exactly the hole the
-- signed-URL flow exists to close. Signing happens with the service-role key,
-- which bypasses RLS and does not need a policy.
drop policy if exists "authenticated can read materials" on storage.objects;

-- --------------------------------------------------------------------------
-- Verification — run these after applying, as an ordinary signed-in user
-- --------------------------------------------------------------------------
--   select * from public.entitlements;   -- only your own rows
--   select * from public.purchases;      -- only your own rows
--   select * from public.webhook_events; -- must return zero rows / denied
--   select public.owns_sku('domain:ethics');
