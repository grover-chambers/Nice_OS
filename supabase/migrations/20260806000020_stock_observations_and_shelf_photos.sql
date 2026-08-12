-- NiceOS: field-capture tables used by the mobile field app and synced to the
-- dashboard. `stock_observations` records "what is on the shelf right now"
-- (per-SKU counts); `shelf_photos` records photo metadata only -- the binary
-- lives in the `shelf-photos` storage bucket under `{rep_id}/{uuid}.jpg`.
--
-- Both carry `deleted_at` tombstones and `updated_at` sync cursors so the
-- mobile client can push/pull deltas (see sync_apply in migration 21).

set search_path = public;

create table if not exists public.stock_observations (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits (id) on delete cascade,
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  rep_id uuid references public.reps (id) on delete set null,
  sku text not null,
  name text,
  qty integer not null default 0,
  shelf public.shelf_level,
  price numeric(10,2),
  captured_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_stock_obs_visit on public.stock_observations (visit_id);
create index if not exists idx_stock_obs_retailer on public.stock_observations (retailer_id);
create index if not exists idx_stock_obs_rep on public.stock_observations (rep_id);
create index if not exists idx_stock_obs_updated on public.stock_observations (updated_at);

create table if not exists public.shelf_photos (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits (id) on delete set null,
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  rep_id uuid references public.reps (id) on delete set null,
  file_path text not null,
  captured_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_shelf_photos_visit on public.shelf_photos (visit_id);
create index if not exists idx_shelf_photos_retailer on public.shelf_photos (retailer_id);
create index if not exists idx_shelf_photos_rep on public.shelf_photos (rep_id);
create index if not exists idx_shelf_photos_updated on public.shelf_photos (updated_at);

-- ---------------------------------------------------------------------------
-- RLS: sales reps see/write their own rows (or rows they created); managers and
-- admins see everything. Mirrors the visits/competitor_observations policies.
-- ---------------------------------------------------------------------------

alter table public.stock_observations enable row level security;

drop policy if exists stock_observations_select on public.stock_observations;
create policy stock_observations_select on public.stock_observations
  for select using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (rep_id = public.current_profile_id() or created_by = public.current_profile_id()))
  );

drop policy if exists stock_observations_insert on public.stock_observations;
create policy stock_observations_insert on public.stock_observations
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (rep_id = public.current_profile_id() or created_by = public.current_profile_id()))
  );

drop policy if exists stock_observations_update on public.stock_observations;
create policy stock_observations_update on public.stock_observations
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (rep_id = public.current_profile_id() or created_by = public.current_profile_id()))
  ) with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (rep_id = public.current_profile_id() or created_by = public.current_profile_id()))
  );

drop policy if exists stock_observations_delete on public.stock_observations;
create policy stock_observations_delete on public.stock_observations
  for delete using (public.is_admin() or public.is_territory_manager());

alter table public.shelf_photos enable row level security;

drop policy if exists shelf_photos_select on public.shelf_photos;
create policy shelf_photos_select on public.shelf_photos
  for select using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (rep_id = public.current_profile_id() or created_by = public.current_profile_id()))
  );

drop policy if exists shelf_photos_insert on public.shelf_photos;
create policy shelf_photos_insert on public.shelf_photos
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (rep_id = public.current_profile_id() or created_by = public.current_profile_id()))
  );

drop policy if exists shelf_photos_update on public.shelf_photos;
create policy shelf_photos_update on public.shelf_photos
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (rep_id = public.current_profile_id() or created_by = public.current_profile_id()))
  ) with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (rep_id = public.current_profile_id() or created_by = public.current_profile_id()))
  );

drop policy if exists shelf_photos_delete on public.shelf_photos;
create policy shelf_photos_delete on public.shelf_photos
  for delete using (public.is_admin() or public.is_territory_manager());

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists stock_observations_set_updated_at on public.stock_observations;
create trigger stock_observations_set_updated_at before update on public.stock_observations
  for each row execute function public.set_updated_at();

drop trigger if exists shelf_photos_set_updated_at on public.shelf_photos;
create trigger shelf_photos_set_updated_at before update on public.shelf_photos
  for each row execute function public.set_updated_at();
