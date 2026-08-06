-- NiceOS: retailers. Rich fields for the web admin (health/churn/order
-- metrics) plus PostGIS `location` + lat/lng + `business_type`/`business_size`
-- aliases kept compatible with the mobile app's Retailer model.
-- created_by records which profile signed the retailer up (RLS scoping).

set search_path = public;

create extension if not exists postgis;

create table if not exists public.retailers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_name text,
  phone text,
  business_type public.outlet_type not null default 'duka',
  business_size text,
  tier public.retailer_tier not null default 'C',
  status public.retailer_status not null default 'prospect',
  ward text,
  constituency text,
  zone text,
  address text,
  location geometry(Point, 4326),
  lat double precision,
  lng double precision,
  health_score integer not null default 55 check (health_score between 0 and 100),
  churn_risk public.churn_risk not null default 'low',
  last_visit_at timestamptz,
  visits30d integer not null default 0,
  orders30d integer not null default 0,
  avg_order_value numeric(12,2) not null default 0,
  order_trend_pct integer not null default 0,
  target_visit_frequency_days integer not null default 7,
  rep_id uuid references public.reps (id) on delete set null,
  territory_id uuid references public.territories (id),
  created_by uuid references public.profiles (id) on delete set null,
  competitor_presence jsonb not null default '[]'::jsonb,
  shelf_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_retailers_location on public.retailers using gist (location);
create index if not exists idx_retailers_zone on public.retailers (zone);
create index if not exists idx_retailers_status on public.retailers (status);
create index if not exists idx_retailers_rep on public.retailers (rep_id);
create index if not exists idx_retailers_territory on public.retailers (territory_id);
create index if not exists idx_retailers_created_by on public.retailers (created_by);

-- Keep PostGIS location in sync with lat/lng on writes.
create or replace function public.sync_retailer_location()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326);
  end if;
  return new;
end;
$$;

drop trigger if exists retailers_sync_location on public.retailers;
create trigger retailers_sync_location
  before insert or update of lat, lng on public.retailers
  for each row execute function public.sync_retailer_location();
