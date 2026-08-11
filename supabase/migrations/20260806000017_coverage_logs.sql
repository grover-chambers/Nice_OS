-- NiceOS: coverage events per territory/ward (visited, under-visited, untouched).

set search_path = public;

create table if not exists public.coverage_logs (
  id uuid primary key default gen_random_uuid(),
  territory_id uuid references public.territories (id) on delete cascade,
  ward text,
  zone text,
  rep_id uuid references public.reps (id) on delete set null,
  event_type text not null check (event_type in ('visited', 'under_visited', 'untouched', 'reassigned')),
  at timestamptz not null default now(),
  note text
);

create index if not exists idx_coverage_logs_territory on public.coverage_logs (territory_id);
create index if not exists idx_coverage_logs_ward on public.coverage_logs (ward);
create index if not exists idx_coverage_logs_at on public.coverage_logs (at);
