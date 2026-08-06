-- NiceOS: persisted alerts (churn, competitive, stock, route, system...).

set search_path = public;

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  severity public.alert_severity not null default 'info',
  category public.alert_category not null default 'system',
  title text not null,
  message text,
  retailer_id uuid references public.retailers (id) on delete cascade,
  rep_id uuid references public.reps (id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_alerts_severity on public.alerts (severity);
create index if not exists idx_alerts_retailer on public.alerts (retailer_id);
create index if not exists idx_alerts_rep on public.alerts (rep_id);
create index if not exists idx_alerts_created on public.alerts (created_at);
