-- NiceOS: territory hierarchy (region -> county -> subcounty -> ward ->
-- sales_territory). The six Nairobi sales zones are seeded as
-- level = 'sales_territory' with stable UUIDs used by the seed migration.

set search_path = public;

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  level public.territory_level not null default 'sales_territory',
  parent_id uuid references public.territories (id) on delete set null,
  zone text,
  geo_json jsonb,
  rep_id uuid,
  target_visits_per_week integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_territories_parent on public.territories (parent_id);
create index if not exists idx_territories_level on public.territories (level);
create index if not exists idx_territories_zone on public.territories (zone);

-- Link profiles to a territory (profiles created before territories).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_territory_id_fkey') then
    alter table public.profiles
      add constraint profiles_territory_id_fkey foreign key (territory_id) references public.territories (id) on delete set null;
  end if;
end $$;

-- Zones (stable UUIDs so seed + app can reference them deterministically).
insert into public.territories (id, name, level, zone)
values
  ('a0000000-0000-4000-8000-000000000001', 'Central',       'sales_territory', 'Central'),
  ('a0000000-0000-4000-8000-000000000002', 'Northern',      'sales_territory', 'Northern'),
  ('a0000000-0000-4000-8000-000000000003', 'Western',       'sales_territory', 'Western'),
  ('a0000000-0000-4000-8000-000000000004', 'Eastern',       'sales_territory', 'Eastern'),
  ('a0000000-0000-4000-8000-000000000005', 'Southern',      'sales_territory', 'Southern'),
  ('a0000000-0000-4000-8000-000000000006', 'South-Eastern', 'sales_territory', 'South-Eastern')
on conflict (id) do nothing;
