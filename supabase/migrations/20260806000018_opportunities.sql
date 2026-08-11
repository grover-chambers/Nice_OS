-- NiceOS: opportunity engine output (reactivation, expansion, category growth...).

set search_path = public;

do $$ begin
  create type public.opportunity_type as enum
    ('reactivation', 'expansion', 'category-growth', 'promo-placement', 'stock-correct');
exception when duplicate_object then null; end $$;

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  type public.opportunity_type not null default 'expansion',
  potential_monthly_kes numeric(12,2) not null default 0,
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  status text not null default 'open' check (status in ('open', 'accepted', 'declined', 'done')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_opportunities_retailer on public.opportunities (retailer_id);
create index if not exists idx_opportunities_status on public.opportunities (status);
