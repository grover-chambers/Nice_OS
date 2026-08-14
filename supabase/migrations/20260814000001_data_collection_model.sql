-- NiceOS: data-collection model (spec §3.1–§4.7, §5, §6).
--
-- Lands the canonical market-reference + capture tables that the mobile
-- census / intercept services already write through the sync queue:
--
--   OUTLET (canonical) ─┬ OUTLET_CONTACT (PD, consent-gated)
--                       ├ OUTLET_CLIENT_LINK (status per client)
--                       └ CATEGORY_OBSERVATION (per visit)
--   CONSUMER_INTERCEPT (anonymous, standalone)
--   CONSENT_RECORD (lawful basis for OUTLET_CONTACT + CONSUMER_INTERCEPT)
--   DAILY_SUBMISSION + BACK_CHECK (§5 daily close / quality control)
--
-- Conventions (mirror migrations 11/20/21):
--   * `updated_at` triggers feed the sync cursor; `deleted_at` is the tombstone
--     the mobile pull applies as a local delete.
--   * Multi-valued fields are `jsonb` because the mobile models serialise
--     lists as JSON arrays and `sync_apply` preserves them verbatim.
--   * Ownership for RLS + sync scoping is `created_by`/`rep_id`/`enumerator_id`
--     (all resolved to the same profile id for a rep).
--   * `sync_entity_table` and `sync_apply` are extended here so the sync
--     function (migration 21) stays immutable.

set search_path = public;

-- ---------------------------------------------------------------------------
-- OUTLET — canonical, shared market reference data (§4.1 + §4.2 + §4.7).
-- ---------------------------------------------------------------------------

create table if not exists public.outlets (
  id uuid primary key default gen_random_uuid(),

  -- 4.1 Identity & location
  business_name text not null,
  channel text not null,
  outlet_type text not null,
  gps_lat double precision not null,
  gps_lng double precision not null,
  gps_accuracy_m double precision,
  county text not null default '',
  constituency text not null default '',
  ward text not null default '',
  beat text not null default '',
  street text,
  landmark text,
  building_or_stall_no text,
  storefront_photo_path text,
  operating_days jsonb not null default '[]'::jsonb,
  opening_hours text,
  year_established integer,
  business_permit_no text,
  till_paybill_no text,

  -- 4.2 Commercial profile
  size_tier text,
  shelf_facing_metres double precision,
  staff_count integer,
  est_daily_customers text,
  has_fridge boolean not null default false,
  has_freezer boolean not null default false,
  storage_capacity text,
  sells_on_credit boolean not null default false,
  accepts_mpesa boolean not null default false,
  purchase_frequency text,
  primary_supply_source text,
  supplier_name text,
  distance_to_supplier text,
  delivery_or_collect text,

  -- 4.7 HoReCa / Institutional extension block
  extension jsonb,

  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_outlets_ward on public.outlets (ward);
create index if not exists idx_outlets_channel on public.outlets (channel);
create index if not exists idx_outlets_created_by on public.outlets (created_by);
create index if not exists idx_outlets_updated_at on public.outlets (updated_at);

-- ---------------------------------------------------------------------------
-- CONSENT_RECORD — §6 lawful basis. Script version, GPS, enumerator and what
-- the respondent agreed to (voluntary + withdrawable, reuse permitted).
-- Created before OUTLET_CONTACT / CONSUMER_INTERCEPT because both reference
-- it.
-- ---------------------------------------------------------------------------

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  script_version text not null default 'v1.0',
  respondent_ref uuid,
  gps_lat double precision not null,
  gps_lng double precision not null,
  enumerator_id uuid references public.reps (id) on delete set null,
  consented_at timestamptz not null default now(),
  voluntary_and_withdrawable boolean not null default true,
  reuse_agreed boolean not null default true,
  withdrawal_phone text,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_consent_records_enumerator on public.consent_records (enumerator_id);
create index if not exists idx_consent_records_updated_at on public.consent_records (updated_at);

-- ---------------------------------------------------------------------------
-- OUTLET_CONTACT — §4.3 personal data, deliberately minimised. Every row must
-- carry a consent_id (rejected by the mobile CensusService otherwise).
-- ---------------------------------------------------------------------------

create table if not exists public.outlet_contacts (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets (id) on delete cascade,
  contact_name text,
  role text,
  phone_primary text,
  phone_alt text,
  preferred_language text,
  is_decision_maker boolean not null default false,
  consent_id uuid references public.consent_records (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_outlet_contacts_outlet on public.outlet_contacts (outlet_id);
create index if not exists idx_outlet_contacts_updated_at on public.outlet_contacts (updated_at);

-- ---------------------------------------------------------------------------
-- OUTLET_CLIENT_LINK — §3.3 status per client, never on the outlet.
-- ---------------------------------------------------------------------------

create table if not exists public.outlet_client_links (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references public.outlets (id) on delete cascade,
  client_id text not null,
  status text not null default 'prospect',
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_outlet_client_links_outlet on public.outlet_client_links (outlet_id);
create index if not exists idx_outlet_client_links_client on public.outlet_client_links (client_id);
create index if not exists idx_outlet_client_links_updated_at on public.outlet_client_links (updated_at);

-- ---------------------------------------------------------------------------
-- CATEGORY_OBSERVATION — §4.4 category & brand presence per visit.
-- ---------------------------------------------------------------------------

create table if not exists public.category_observations (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits (id) on delete cascade,
  outlet_id uuid references public.outlets (id) on delete cascade,
  rep_id uuid references public.reps (id) on delete set null,
  category text not null,
  stocked_now boolean not null default false,
  brands_present jsonb not null default '[]'::jsonb,
  other_brands text,
  pack_sizes_present jsonb not null default '[]'::jsonb,
  shelf_facings integer not null default 0,
  price_observed double precision,
  stock_units_on_hand integer,
  stockout_last_7_days boolean not null default false,
  fastest_moving_brand text,
  why_fastest text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_category_observations_outlet on public.category_observations (outlet_id);
create index if not exists idx_category_observations_rep on public.category_observations (rep_id);
create index if not exists idx_category_observations_updated_at on public.category_observations (updated_at);

-- ---------------------------------------------------------------------------
-- CONSUMER_INTERCEPT — §4.6 anonymous, always. No identifiers; demographic
-- bands only. The unaided→aided ordering is enforced by the mobile survey
-- sequence lock before the row is written.
-- ---------------------------------------------------------------------------

create table if not exists public.consumer_intercepts (
  id uuid primary key default gen_random_uuid(),
  ward text not null default '',
  channel_context text not null default 'traditional',
  household_size_band text,
  shopper_role text,
  categories_bought_weekly jsonb not null default '[]'::jsonb,
  unaided_brands_aware jsonb not null default '[]'::jsonb,
  aided_brands_aware jsonb not null default '[]'::jsonb,
  flour_brand_used_now text,
  milk_brand_used_now text,
  pack_size_preferred text,
  purchase_frequency text,
  where_they_buy text,
  price_paid_last double precision,
  switch_trigger text,
  max_acceptable_price double precision,
  would_try_new_brand text,
  consent_id uuid references public.consent_records (id) on delete set null,
  enumerator_id uuid references public.reps (id) on delete set null,
  captured_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_consumer_intercepts_ward on public.consumer_intercepts (ward);
create index if not exists idx_consumer_intercepts_enumerator on public.consumer_intercepts (enumerator_id);
create index if not exists idx_consumer_intercepts_updated_at on public.consumer_intercepts (updated_at);

-- ---------------------------------------------------------------------------
-- DAILY_SUBMISSION — §5 daily close. One batch per enumerator per day;
-- supervisors approve, flag for back-check or reject the whole batch.
-- ---------------------------------------------------------------------------

create table if not exists public.daily_submissions (
  id uuid primary key default gen_random_uuid(),
  enumerator_id uuid references public.reps (id) on delete set null,
  submission_date date not null,
  outlet_count integer not null default 0,
  intercept_count integer not null default 0,
  visit_count integer not null default 0,
  quality_flags jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  supervisor_note text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_daily_submissions_enumerator on public.daily_submissions (enumerator_id);
create index if not exists idx_daily_submissions_date on public.daily_submissions (submission_date);
create index if not exists idx_daily_submissions_updated_at on public.daily_submissions (updated_at);

-- ---------------------------------------------------------------------------
-- BACK_CHECK — §5. Supervisors independently re-visit a sample of outlets and
-- re-record blind; results are matched against the original census record.
-- ---------------------------------------------------------------------------

create table if not exists public.back_checks (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references public.outlets (id) on delete cascade,
  enumerator_id uuid references public.reps (id) on delete set null,
  supervisor_id uuid references public.profiles (id) on delete set null,
  revisited_at timestamptz not null default now(),
  gps_lat double precision not null,
  gps_lng double precision not null,
  business_matches boolean not null default true,
  open_for_business boolean not null default true,
  discrepancy text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_back_checks_outlet on public.back_checks (outlet_id);
create index if not exists idx_back_checks_enumerator on public.back_checks (enumerator_id);
create index if not exists idx_back_checks_updated_at on public.back_checks (updated_at);

-- ---------------------------------------------------------------------------
-- Visits FK relaxation: census-originated visits reference the OUTLET id
-- (the canonical market-data row), which is not a `retailers` row. Drop the
-- hard FK so the offline census write path works; the column and its index
-- stay for the web admin joins where a matching retailer exists.
-- ---------------------------------------------------------------------------

alter table public.visits drop constraint if exists visits_retailer_id_fkey;

-- ---------------------------------------------------------------------------
-- updated_at triggers (public.set_updated_at defined in migration 11)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'outlets', 'outlet_contacts', 'outlet_client_links', 'consent_records',
    'category_observations', 'consumer_intercepts', 'daily_submissions',
    'back_checks'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS: direct clients see and mutate only rows they own (mirrors migration 11).
-- ---------------------------------------------------------------------------

create or replace function public.owns_outlet(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.outlets o
     where o.id = p_id
       and (public.is_admin() or public.is_territory_manager()
            or o.created_by = public.current_profile_id())
  );
$$;

-- outlets
alter table public.outlets enable row level security;
drop policy if exists outlets_select on public.outlets;
create policy outlets_select on public.outlets
  for select using (
    public.is_admin() or public.is_territory_manager()
    or (public.is_sales_rep() and created_by = public.current_profile_id())
  );
drop policy if exists outlets_insert on public.outlets;
create policy outlets_insert on public.outlets
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and created_by = public.current_profile_id())
  );
drop policy if exists outlets_update on public.outlets;
create policy outlets_update on public.outlets
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and created_by = public.current_profile_id())
  )
  with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and created_by = public.current_profile_id())
  );
drop policy if exists outlets_delete on public.outlets;
create policy outlets_delete on public.outlets
  for delete using (
    public.is_admin() or public.is_territory_manager()
  );

-- outlet_contacts (visibility inherits the parent outlet)
alter table public.outlet_contacts enable row level security;
drop policy if exists outlet_contacts_select on public.outlet_contacts;
create policy outlet_contacts_select on public.outlet_contacts
  for select using (
    public.is_admin() or public.is_territory_manager()
    or (public.is_sales_rep() and public.owns_outlet(outlet_id))
  );
drop policy if exists outlet_contacts_insert on public.outlet_contacts;
create policy outlet_contacts_insert on public.outlet_contacts
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and public.owns_outlet(outlet_id))
  );
drop policy if exists outlet_contacts_update on public.outlet_contacts;
create policy outlet_contacts_update on public.outlet_contacts
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and public.owns_outlet(outlet_id))
  );
drop policy if exists outlet_contacts_delete on public.outlet_contacts;
create policy outlet_contacts_delete on public.outlet_contacts
  for delete using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and public.owns_outlet(outlet_id))
  );

-- outlet_client_links
alter table public.outlet_client_links enable row level security;
drop policy if exists outlet_client_links_select on public.outlet_client_links;
create policy outlet_client_links_select on public.outlet_client_links
  for select using (
    public.is_admin() or public.is_territory_manager()
    or (public.is_sales_rep() and public.owns_outlet(outlet_id))
  );
drop policy if exists outlet_client_links_insert on public.outlet_client_links;
create policy outlet_client_links_insert on public.outlet_client_links
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and public.owns_outlet(outlet_id))
  );
drop policy if exists outlet_client_links_update on public.outlet_client_links;
create policy outlet_client_links_update on public.outlet_client_links
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and public.owns_outlet(outlet_id))
  );
drop policy if exists outlet_client_links_delete on public.outlet_client_links;
create policy outlet_client_links_delete on public.outlet_client_links
  for delete using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and public.owns_outlet(outlet_id))
  );

-- consent_records (owned by the enumerator)
alter table public.consent_records enable row level security;
drop policy if exists consent_records_select on public.consent_records;
create policy consent_records_select on public.consent_records
  for select using (
    public.is_admin() or public.is_territory_manager()
    or (public.is_sales_rep() and enumerator_id = public.current_profile_id())
  );
drop policy if exists consent_records_insert on public.consent_records;
create policy consent_records_insert on public.consent_records
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and enumerator_id = public.current_profile_id())
  );
drop policy if exists consent_records_update on public.consent_records;
create policy consent_records_update on public.consent_records
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and enumerator_id = public.current_profile_id())
  );
drop policy if exists consent_records_delete on public.consent_records;
create policy consent_records_delete on public.consent_records
  for delete using (
    public.is_admin() or public.is_territory_manager()
  );

-- category_observations (owned by the reporting rep)
alter table public.category_observations enable row level security;
drop policy if exists category_observations_select on public.category_observations;
create policy category_observations_select on public.category_observations
  for select using (
    public.is_admin() or public.is_territory_manager()
    or (public.is_sales_rep() and rep_id = public.current_profile_id())
  );
drop policy if exists category_observations_insert on public.category_observations;
create policy category_observations_insert on public.category_observations
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and rep_id = public.current_profile_id())
  );
drop policy if exists category_observations_update on public.category_observations;
create policy category_observations_update on public.category_observations
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and rep_id = public.current_profile_id())
  );
drop policy if exists category_observations_delete on public.category_observations;
create policy category_observations_delete on public.category_observations
  for delete using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and rep_id = public.current_profile_id())
  );

-- consumer_intercepts (owned by the enumerator)
alter table public.consumer_intercepts enable row level security;
drop policy if exists consumer_intercepts_select on public.consumer_intercepts;
create policy consumer_intercepts_select on public.consumer_intercepts
  for select using (
    public.is_admin() or public.is_territory_manager()
    or (public.is_sales_rep() and enumerator_id = public.current_profile_id())
  );
drop policy if exists consumer_intercepts_insert on public.consumer_intercepts;
create policy consumer_intercepts_insert on public.consumer_intercepts
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and enumerator_id = public.current_profile_id())
  );
drop policy if exists consumer_intercepts_update on public.consumer_intercepts;
create policy consumer_intercepts_update on public.consumer_intercepts
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and enumerator_id = public.current_profile_id())
  );
drop policy if exists consumer_intercepts_delete on public.consumer_intercepts;
create policy consumer_intercepts_delete on public.consumer_intercepts
  for delete using (
    public.is_admin() or public.is_territory_manager()
  );

-- daily_submissions (owned by the enumerator)
alter table public.daily_submissions enable row level security;
drop policy if exists daily_submissions_select on public.daily_submissions;
create policy daily_submissions_select on public.daily_submissions
  for select using (
    public.is_admin() or public.is_territory_manager()
    or (public.is_sales_rep() and enumerator_id = public.current_profile_id())
  );
drop policy if exists daily_submissions_insert on public.daily_submissions;
create policy daily_submissions_insert on public.daily_submissions
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and enumerator_id = public.current_profile_id())
  );
drop policy if exists daily_submissions_update on public.daily_submissions;
create policy daily_submissions_update on public.daily_submissions
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and enumerator_id = public.current_profile_id())
  );
drop policy if exists daily_submissions_delete on public.daily_submissions;
create policy daily_submissions_delete on public.daily_submissions
  for delete using (
    public.is_admin() or public.is_territory_manager()
  );

-- back_checks (enumerator sees checks against their work; supervisor owns them)
alter table public.back_checks enable row level security;
drop policy if exists back_checks_select on public.back_checks;
create policy back_checks_select on public.back_checks
  for select using (
    public.is_admin() or public.is_territory_manager()
    or (public.is_sales_rep()
        and (enumerator_id = public.current_profile_id()
             or supervisor_id = public.current_profile_id()))
  );
drop policy if exists back_checks_insert on public.back_checks;
create policy back_checks_insert on public.back_checks
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and supervisor_id = public.current_profile_id())
  );
drop policy if exists back_checks_update on public.back_checks;
create policy back_checks_update on public.back_checks
  for update using (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep()
        and (enumerator_id = public.current_profile_id()
             or supervisor_id = public.current_profile_id()))
  );
drop policy if exists back_checks_delete on public.back_checks;
create policy back_checks_delete on public.back_checks
  for delete using (
    public.is_admin() or public.is_territory_manager()
  );

-- ---------------------------------------------------------------------------
-- Sync registry: extend the whitelist with the new entities.
-- ---------------------------------------------------------------------------

create or replace function public.sync_entity_table(p_entity text)
returns text
language sql
immutable
as $$
  select case p_entity
    when 'routes'                  then 'public.routes'
    when 'route_stops'             then 'public.route_stops'
    when 'retailers'               then 'public.retailers'
    when 'visits'                  then 'public.visits'
    when 'visit_items'             then 'public.visit_items'
    when 'competitor_observations' then 'public.competitor_observations'
    when 'order_intents'           then 'public.order_intents'
    when 'order_intent_items'      then 'public.order_intent_items'
    when 'health_scores'           then 'public.health_scores'
    when 'stock_observations'      then 'public.stock_observations'
    when 'shelf_photos'            then 'public.shelf_photos'
    when 'outlets'                 then 'public.outlets'
    when 'outlet_contacts'         then 'public.outlet_contacts'
    when 'outlet_client_links'     then 'public.outlet_client_links'
    when 'consent_records'         then 'public.consent_records'
    when 'category_observations'   then 'public.category_observations'
    when 'consumer_intercepts'     then 'public.consumer_intercepts'
    when 'daily_submissions'       then 'public.daily_submissions'
    when 'back_checks'             then 'public.back_checks'
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- sync_apply: upsert a batch of rows for one entity, last-write-wins.
-- Rewritten so jsonb columns (arrays, extension blocks) are written verbatim
-- instead of being stringified by `->>` (which would turn `["A"]` into the
-- JSON string "\"A\"" inside the column).
-- ---------------------------------------------------------------------------

create or replace function public.sync_apply(p_entity text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table text := public.sync_entity_table(p_entity);
  v_plain text;
  v_row jsonb;
  v_id uuid;
  r_col record;
  v_cols text[];
  v_vals text[];
  v_updates text[];
  v_sql text;
  v_count int;
  v_applied int := 0;
  v_conflicts jsonb := '[]'::jsonb;
  v_exists boolean;
  v_server_ts timestamptz;
begin
  if v_table is null then
    return jsonb_build_object('error', 'unknown entity', 'entity', p_entity);
  end if;
  v_plain := regexp_replace(v_table, '^public\.', '');

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_id := nullif(v_row->>'id', '')::uuid;
    if v_id is null then
      v_conflicts := v_conflicts || jsonb_build_object(
        'entity', p_entity, 'id', null, 'reason', 'missing-id'
      );
      continue;
    end if;

    v_cols := array[]::text[];
    v_vals := array[]::text[];
    v_updates := array[]::text[];
    for r_col in
      select column_name, data_type
        from information_schema.columns
       where table_schema = 'public'
         and table_name = v_plain
       order by ordinal_position
    loop
      if not (v_row ? r_col.column_name) then
        continue;
      end if;

      v_cols := v_cols || quote_ident(r_col.column_name);
      if r_col.data_type in ('jsonb', 'json') and v_row->r_col.column_name is not null then
        -- jsonb verbatim: `["Pembe"]` stays an array, `"x"` stays a string.
        v_vals := v_vals || format('%L::jsonb', v_row->r_col.column_name);
      else
        v_vals := v_vals || coalesce(quote_literal(v_row->>r_col.column_name), 'NULL');
      end if;

      if r_col.column_name <> 'id' then
        v_updates := v_updates || format('%I = excluded.%I', r_col.column_name, r_col.column_name);
      end if;
    end loop;

    if cardinality(v_cols) = 0 then
      v_conflicts := v_conflicts || jsonb_build_object(
        'entity', p_entity, 'id', v_id::text, 'reason', 'empty-row'
      );
      continue;
    end if;

    v_sql := format(
      'insert into %s (%s) values (%s) on conflict (id) do update set %s where %I.updated_at < excluded.updated_at',
      v_table,
      array_to_string(v_cols, ', '),
      array_to_string(v_vals, ', '),
      array_to_string(v_updates, ', '),
      v_plain
    );

    begin
      execute v_sql;
      get diagnostics v_count = row_count;
    exception when others then
      v_conflicts := v_conflicts || jsonb_build_object(
        'entity', p_entity, 'id', v_id::text, 'reason', 'error: ' || sqlerrm
      );
      continue;
    end;

    if v_count > 0 then
      v_applied := v_applied + 1;
    else
      execute format('select exists (select 1 from %s where id = %L)', v_table, v_id::text) into v_exists;
      execute format('select updated_at from %s where id = %L', v_table, v_id::text) into v_server_ts;
      v_conflicts := v_conflicts || jsonb_build_object(
        'entity', p_entity,
        'id', v_id::text,
        'server_updated_at', v_server_ts::text,
        'reason', case when v_exists then 'newer-server-row' else 'insert-failed' end
      );
    end if;
  end loop;

  return jsonb_build_object('applied', v_applied, 'conflicts', v_conflicts);
end;
$$;

-- Only service_role (edge functions) may invoke the raw sync path.
revoke execute on function public.sync_apply(text, jsonb) from public, anon, authenticated;
grant execute on function public.sync_apply(text, jsonb) to service_role;
