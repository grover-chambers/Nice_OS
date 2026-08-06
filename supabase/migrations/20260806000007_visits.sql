-- NiceOS: visits (check-ins). Columns cover both the mobile app's fields
-- (check_in_at/check_out_at/gps/outcome/notes) and the web admin's
-- (rep_id/route_id/status/order metrics/stock capture).

set search_path = public;

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  rep_id uuid references public.reps (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  route_id uuid references public.routes (id) on delete set null,
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  gps_lat double precision not null,
  gps_lng double precision not null,
  gps_accuracy double precision,
  gps_verified boolean not null default false,
  radius_m integer not null default 0,
  status public.visit_status not null default 'completed',
  duration_min integer,
  stock_captured boolean not null default false,
  photo_count integer not null default 0,
  order_placed boolean not null default false,
  order_value numeric(12,2),
  outcome public.visit_status not null default 'completed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visits_retailer on public.visits (retailer_id);
create index if not exists idx_visits_rep on public.visits (rep_id);
create index if not exists idx_visits_route on public.visits (route_id);
create index if not exists idx_visits_created on public.visits (created_at);

create table if not exists public.visit_items (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references public.visits (id) on delete cascade,
  sku text not null,
  name text,
  qty integer not null default 0,
  shelf public.shelf_level,
  price numeric(10,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_visit_items_visit on public.visit_items (visit_id);
