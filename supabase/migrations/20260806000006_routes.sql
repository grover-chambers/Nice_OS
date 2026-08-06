-- NiceOS: daily routes + their ordered stops.

set search_path = public;

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  rep_id uuid not null references public.reps (id) on delete cascade,
  zone text,
  status public.route_status not null default 'draft',
  total_km numeric(8,2) not null default 0,
  total_travel_min integer not null default 0,
  start_time time,
  end_time time,
  created_by uuid references public.profiles (id) on delete set null,
  revised_by uuid references public.profiles (id) on delete set null,
  revised_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_routes_rep on public.routes (rep_id);
create index if not exists idx_routes_date on public.routes (date);
create index if not exists idx_routes_status on public.routes (status);

create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  retailer_id uuid not null references public.retailers (id),
  position integer not null check (position > 0),
  planned_start time,
  planned_end time,
  visit_type public.visit_type not null default 'retail',
  km_from_prev numeric(8,2) not null default 0,
  minutes_from_prev integer not null default 0,
  visited boolean not null default false,
  visited_at timestamptz,
  priority public.route_priority not null default 'medium',
  created_at timestamptz not null default now(),
  unique (route_id, position)
);

create index if not exists idx_route_stops_route on public.route_stops (route_id);
create index if not exists idx_route_stops_retailer on public.route_stops (retailer_id);
