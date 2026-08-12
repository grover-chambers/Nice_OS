-- NiceOS: sync infrastructure.
--
-- 1) Every synced entity gets an `updated_at` (sync cursor, indexed) and a
--    `deleted_at` tombstone (mobile pull applies `deleted_at != null` as a
--    local delete).
-- 2) `sync_apply(entity, rows)` is the single server-side write path used by
--    the `sync-push` edge function. It is SECURITY DEFINER and executes a
--    per-row `INSERT ... ON CONFLICT (id) DO UPDATE ... WHERE
--    excluded.updated_at > tbl.updated_at` (last-write-wins).
-- 3) Execute is restricted to service_role so only edge functions can call it;
--    direct clients cannot bypass RLS through it.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Add sync columns to tables that lack them
-- ---------------------------------------------------------------------------

alter table public.route_stops            add column if not exists updated_at timestamptz not null default now();
alter table public.route_stops            add column if not exists deleted_at timestamptz;
alter table public.visit_items            add column if not exists updated_at timestamptz not null default now();
alter table public.visit_items            add column if not exists deleted_at timestamptz;
alter table public.order_intent_items     add column if not exists updated_at timestamptz not null default now();
alter table public.order_intent_items     add column if not exists deleted_at timestamptz;
alter table public.competitor_observations add column if not exists updated_at timestamptz not null default now();
alter table public.competitor_observations add column if not exists deleted_at timestamptz;
alter table public.health_scores          add column if not exists updated_at timestamptz not null default now();
alter table public.health_scores          add column if not exists deleted_at timestamptz;

alter table public.retailers              add column if not exists deleted_at timestamptz;
alter table public.routes                 add column if not exists deleted_at timestamptz;
alter table public.visits                 add column if not exists deleted_at timestamptz;
alter table public.order_intents          add column if not exists deleted_at timestamptz;

-- ---------------------------------------------------------------------------
-- updated_at triggers (set_updated_at defined in migration 11)
-- ---------------------------------------------------------------------------

drop trigger if exists route_stops_set_updated_at on public.route_stops;
create trigger route_stops_set_updated_at before update on public.route_stops
  for each row execute function public.set_updated_at();

drop trigger if exists visit_items_set_updated_at on public.visit_items;
create trigger visit_items_set_updated_at before update on public.visit_items
  for each row execute function public.set_updated_at();

drop trigger if exists order_intent_items_set_updated_at on public.order_intent_items;
create trigger order_intent_items_set_updated_at before update on public.order_intent_items
  for each row execute function public.set_updated_at();

drop trigger if exists competitor_observations_set_updated_at on public.competitor_observations;
create trigger competitor_observations_set_updated_at before update on public.competitor_observations
  for each row execute function public.set_updated_at();

drop trigger if exists health_scores_set_updated_at on public.health_scores;
create trigger health_scores_set_updated_at before update on public.health_scores
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sync-cursor indexes (one per synced entity)
-- ---------------------------------------------------------------------------

create index if not exists idx_retailers_updated_at on public.retailers (updated_at);
create index if not exists idx_routes_updated_at on public.routes (updated_at);
create index if not exists idx_route_stops_updated_at on public.route_stops (updated_at);
create index if not exists idx_visits_updated_at on public.visits (updated_at);
create index if not exists idx_visit_items_updated_at on public.visit_items (updated_at);
create index if not exists idx_order_intents_updated_at on public.order_intents (updated_at);
create index if not exists idx_order_intent_items_updated_at on public.order_intent_items (updated_at);
create index if not exists idx_competitor_observations_updated_at on public.competitor_observations (updated_at);
create index if not exists idx_health_scores_updated_at on public.health_scores (updated_at);
create index if not exists idx_stock_observations_updated_at on public.stock_observations (updated_at);
create index if not exists idx_shelf_photos_updated_at on public.shelf_photos (updated_at);

-- ---------------------------------------------------------------------------
-- Entity whitelist -> table mapping (single source of truth for sync_apply)
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
    else null
  end;
$$;

-- ---------------------------------------------------------------------------
-- sync_apply: upsert a batch of rows for one entity, last-write-wins.
-- Returns { applied, conflicts: [{ entity, id, server_updated_at, reason }] }.
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
  v_keys text[];
  v_col text;
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

  select coalesce(array_agg(column_name::text), '{}'::text[])
    into v_keys
    from information_schema.columns
   where table_schema = 'public'
     and table_name = v_plain;

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
    foreach v_col in array v_keys loop
      if v_row ? v_col then
        v_cols := v_cols || quote_ident(v_col);
        v_vals := v_vals || coalesce(quote_literal(v_row->>v_col), 'NULL');
        if v_col <> 'id' then
          v_updates := v_updates || format('%I = excluded.%I', v_col, v_col);
        end if;
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
