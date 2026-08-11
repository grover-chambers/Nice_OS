-- NiceOS: competitor brand reference list for observation dropdowns.

set search_path = public;

create table if not exists public.competitor_brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  segment text not null default 'rice',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_competitor_brands_active on public.competitor_brands (active);
