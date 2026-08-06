-- NiceOS: competitor observations logged at a retailer (from a visit or ad-hoc).

set search_path = public;

create table if not exists public.competitor_observations (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  rep_id uuid references public.reps (id) on delete set null,
  visit_id uuid references public.visits (id) on delete set null,
  brand text not null,
  product_name text,
  price numeric(10,2),
  shelf_presence text default 'none' check (shelf_presence in ('full_facing', 'half_facing', 'shelf_edge', 'none')),
  activity public.competitor_activity not null default 'promo',
  promotion_active boolean not null default false,
  note text,
  at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_competitor_obs_retailer on public.competitor_observations (retailer_id);
create index if not exists idx_competitor_obs_rep on public.competitor_observations (rep_id);
create index if not exists idx_competitor_obs_at on public.competitor_observations (at);
