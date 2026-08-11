-- NiceOS: SKU catalog (reference data for stock checks and order intents).

set search_path = public;

create table if not exists public.sku_catalog (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null default 'rice',
  default_price_kes numeric(10,2),
  unit text not null default 'kg',
  pack_size text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sku_catalog_active on public.sku_catalog (active);
