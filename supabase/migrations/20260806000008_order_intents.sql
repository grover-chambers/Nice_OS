-- NiceOS: order intents forwarded to WhatsApp/sales. Header row + line items.

set search_path = public;

create table if not exists public.order_intents (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  rep_id uuid references public.reps (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  total numeric(12,2) not null default 0,
  forward_status public.order_forward_status not null default 'pending',
  forwarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_order_intents_retailer on public.order_intents (retailer_id);
create index if not exists idx_order_intents_rep on public.order_intents (rep_id);
create index if not exists idx_order_intents_status on public.order_intents (forward_status);

create table if not exists public.order_intent_items (
  id uuid primary key default gen_random_uuid(),
  order_intent_id uuid not null references public.order_intents (id) on delete cascade,
  sku text not null,
  name text,
  quantity integer not null check (quantity > 0),
  price numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_intent_items_intent on public.order_intent_items (order_intent_id);
