-- NiceOS: persisted per-retailer health score history (auditable, recomputed
-- by health-score-engine and on visits).

set search_path = public;

create table if not exists public.health_scores (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  churn_risk text not null default 'low' check (churn_risk in ('low', 'medium', 'high')),
  factors jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

create index if not exists idx_health_scores_retailer on public.health_scores (retailer_id, computed_at desc);
