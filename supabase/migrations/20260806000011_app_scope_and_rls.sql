-- NiceOS: role scoping + row level security.
--
-- app_scope() (also exposed as current_scope()) resolves the calling auth
-- user to (profile id, role, scoped zones, rep id). Every table's policies
-- route through it:
--   * admin             -> sees everything
--   * territory_manager -> sees its own zone(s) + reps it manages
--   * sales_rep         -> sees its own retailers/visits/routes + things it created
--   * ceo               -> aggregate access only (handled by dedicated views in Phase B)
-- Unauthenticated users see nothing (empty scope).

set search_path = public;

-- ---------------------------------------------------------------------------
-- Scope resolution
-- ---------------------------------------------------------------------------

create or replace function public.app_scope()
returns table (
  uid uuid,
  role public.user_role,
  zones text[],
  rep_id uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.role,
    case
      when p.role = 'territory_manager' then array_remove(array[p.zone], null)
      when p.role = 'sales_rep' then array_remove(array[p.zone], null)
      else null
    end,
    p.id
  from public.profiles p
  where p.auth_id = auth.uid()
    and p.status = 'active';
$$;

-- Alias used by policies (functions below also work; kept for API completeness).
create or replace function public.current_scope()
returns table (uid uuid, role public.user_role, zones text[], rep_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select * from public.app_scope();
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select uid from public.app_scope() limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Predicate helpers (used inside policies)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_scope() s where s.role = 'admin');
$$;

create or replace function public.is_territory_manager() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_scope() s where s.role = 'territory_manager');
$$;

create or replace function public.is_sales_rep() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_scope() s where s.role = 'sales_rep');
$$;

create or replace function public.is_ceo() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_scope() s where s.role = 'ceo');
$$;

create or replace function public.zone_in_scope(target text) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_scope() s where target = any (s.zones));
$$;

-- A manager can see a rep when the rep is in the manager's zone or reports to
-- the manager directly.
create or replace function public.manages_rep(target_rep_id uuid) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_scope() s
    join public.reps r on r.id = target_rep_id
    where s.role = 'territory_manager'
      and (r.zone = any (s.zones) or r.manager_id = s.uid)
  );
$$;

-- ---------------------------------------------------------------------------
-- Row visibility functions
-- ---------------------------------------------------------------------------

create or replace function public.can_see_retailer(r public.retailers) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_scope() s
    where s.role = 'admin'
       or (s.role = 'territory_manager' and (r.zone = any (s.zones) or r.rep_id = s.uid or exists (select 1 from public.reps rp where rp.id = r.rep_id and rp.manager_id = s.uid)))
       or (s.role = 'sales_rep' and (r.rep_id = s.rep_id or r.created_by = s.uid))
  );
$$;

create or replace function public.can_see_rep(r public.reps) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_scope() s
    where s.role = 'admin'
       or (s.role = 'territory_manager' and (r.id = s.uid or r.manager_id = s.uid or r.zone = any (s.zones)))
       or (s.role = 'sales_rep' and r.id = s.rep_id)
  );
$$;

create or replace function public.can_see_route(r public.routes) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_scope() s
    where s.role = 'admin'
       or (s.role = 'territory_manager' and (r.rep_id = s.uid or exists (select 1 from public.reps rp where rp.id = r.rep_id and (rp.manager_id = s.uid or rp.zone = any (s.zones)))))
       or (s.role = 'sales_rep' and r.rep_id = s.rep_id)
  );
$$;

create or replace function public.can_see_visit(v public.visits) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_scope() s
    where s.role = 'admin'
       or (s.role = 'territory_manager' and (v.rep_id = s.uid or exists (select 1 from public.reps rp where rp.id = v.rep_id and (rp.manager_id = s.uid or rp.zone = any (s.zones)))))
       or (s.role = 'sales_rep' and v.rep_id = s.rep_id)
  );
$$;

create or replace function public.can_see_order_intent(o public.order_intents) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_scope() s
    where s.role = 'admin'
       or (s.role = 'territory_manager' and (o.rep_id = s.uid or exists (select 1 from public.reps rp where rp.id = o.rep_id and (rp.manager_id = s.uid or rp.zone = any (s.zones)))))
       or (s.role = 'sales_rep' and (o.rep_id = s.rep_id or o.created_by = s.uid))
  );
$$;

create or replace function public.can_see_competitor_observation(c public.competitor_observations) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_scope() s
    where s.role = 'admin'
       or (s.role = 'territory_manager' and (c.rep_id = s.uid or exists (select 1 from public.reps rp where rp.id = c.rep_id and (rp.manager_id = s.uid or rp.zone = any (s.zones)))))
       or (s.role = 'sales_rep' and c.rep_id = s.rep_id)
  );
$$;

create or replace function public.can_see_alert(a public.alerts) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_scope() s
    where s.role = 'admin'
       or (s.role = 'territory_manager' and (a.retailer_id is null or exists (select 1 from public.retailers r where r.id = a.retailer_id and (r.zone = any (s.zones) or exists (select 1 from public.reps rp where rp.id = r.rep_id and rp.manager_id = s.uid)))))
       or (s.role = 'sales_rep' and (a.rep_id = s.rep_id or (a.retailer_id is not null and exists (select 1 from public.retailers r where r.id = a.retailer_id and (r.rep_id = s.rep_id or r.created_by = s.uid)))))
  );
$$;

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    public.is_admin()
    or auth.uid() = auth_id
    or exists (
      select 1
      from public.app_scope() s
      where s.role = 'territory_manager'
        and (profiles.id = s.uid or profiles.zone = any (s.zones))
    )
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (
    auth.uid() = auth_id
    or public.is_admin()
  ) with check (
    auth.uid() = auth_id
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- territories
-- ---------------------------------------------------------------------------

alter table public.territories enable row level security;

drop policy if exists territories_select on public.territories;
create policy territories_select on public.territories
  for select using (public.is_admin() or public.is_territory_manager() or public.is_sales_rep() or public.zone_in_scope(territories.zone));

drop policy if exists territories_insert on public.territories;
create policy territories_insert on public.territories
  for insert with check (public.is_admin());

drop policy if exists territories_update on public.territories;
create policy territories_update on public.territories
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists territories_delete on public.territories;
create policy territories_delete on public.territories
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- reps
-- ---------------------------------------------------------------------------

alter table public.reps enable row level security;

drop policy if exists reps_select on public.reps;
create policy reps_select on public.reps
  for select using (public.can_see_rep(reps));

drop policy if exists reps_insert on public.reps;
create policy reps_insert on public.reps
  for insert with check (public.is_admin() or public.is_territory_manager());

drop policy if exists reps_update on public.reps;
create policy reps_update on public.reps
  for update using (public.can_see_rep(reps)) with check (public.can_see_rep(reps));

drop policy if exists reps_delete on public.reps;
create policy reps_delete on public.reps
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- retailers
-- ---------------------------------------------------------------------------

alter table public.retailers enable row level security;

drop policy if exists retailers_select on public.retailers;
create policy retailers_select on public.retailers
  for select using (public.can_see_retailer(retailers));

drop policy if exists retailers_insert on public.retailers;
create policy retailers_insert on public.retailers
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (created_by = public.current_profile_id() or rep_id = public.current_profile_id()))
  );

drop policy if exists retailers_update on public.retailers;
create policy retailers_update on public.retailers
  for update using (public.can_see_retailer(retailers))
  with check (
    public.can_see_retailer(retailers)
    and (public.is_admin() or public.is_territory_manager() or rep_id = public.current_profile_id() or created_by = public.current_profile_id())
  );

drop policy if exists retailers_delete on public.retailers;
create policy retailers_delete on public.retailers
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- routes
-- ---------------------------------------------------------------------------

alter table public.routes enable row level security;

drop policy if exists routes_select on public.routes;
create policy routes_select on public.routes
  for select using (public.can_see_route(routes));

drop policy if exists routes_insert on public.routes;
create policy routes_insert on public.routes
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and rep_id = public.current_profile_id())
  );

drop policy if exists routes_update on public.routes;
create policy routes_update on public.routes
  for update using (public.can_see_route(routes))
  with check (
    public.can_see_route(routes)
    and (public.is_admin() or public.is_territory_manager() or rep_id = public.current_profile_id())
  );

drop policy if exists routes_delete on public.routes;
create policy routes_delete on public.routes
  for delete using (public.is_admin() or public.is_territory_manager());

-- ---------------------------------------------------------------------------
-- route_stops (inherit route visibility)
-- ---------------------------------------------------------------------------

alter table public.route_stops enable row level security;

drop policy if exists route_stops_select on public.route_stops;
create policy route_stops_select on public.route_stops
  for select using (
    exists (select 1 from public.routes r where r.id = route_stops.route_id and public.can_see_route(r))
  );

drop policy if exists route_stops_insert on public.route_stops;
create policy route_stops_insert on public.route_stops
  for insert with check (
    exists (select 1 from public.routes r where r.id = route_stops.route_id and public.can_see_route(r))
  );

drop policy if exists route_stops_update on public.route_stops;
create policy route_stops_update on public.route_stops
  for update using (
    exists (select 1 from public.routes r where r.id = route_stops.route_id and public.can_see_route(r))
  ) with check (
    exists (select 1 from public.routes r where r.id = route_stops.route_id and public.can_see_route(r))
  );

drop policy if exists route_stops_delete on public.route_stops;
create policy route_stops_delete on public.route_stops
  for delete using (
    exists (select 1 from public.routes r where r.id = route_stops.route_id and public.can_see_route(r))
  );

-- ---------------------------------------------------------------------------
-- visits
-- ---------------------------------------------------------------------------

alter table public.visits enable row level security;

drop policy if exists visits_select on public.visits;
create policy visits_select on public.visits
  for select using (public.can_see_visit(visits));

drop policy if exists visits_insert on public.visits;
create policy visits_insert on public.visits
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and rep_id = public.current_profile_id())
  );

drop policy if exists visits_update on public.visits;
create policy visits_update on public.visits
  for update using (public.can_see_visit(visits))
  with check (public.can_see_visit(visits));

drop policy if exists visits_delete on public.visits;
create policy visits_delete on public.visits
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- visit_items (inherit visit visibility)
-- ---------------------------------------------------------------------------

alter table public.visit_items enable row level security;

drop policy if exists visit_items_select on public.visit_items;
create policy visit_items_select on public.visit_items
  for select using (
    exists (select 1 from public.visits v where v.id = visit_items.visit_id and public.can_see_visit(v))
  );

drop policy if exists visit_items_insert on public.visit_items;
create policy visit_items_insert on public.visit_items
  for insert with check (
    exists (select 1 from public.visits v where v.id = visit_items.visit_id and public.can_see_visit(v))
  );

drop policy if exists visit_items_update on public.visit_items;
create policy visit_items_update on public.visit_items
  for update using (
    exists (select 1 from public.visits v where v.id = visit_items.visit_id and public.can_see_visit(v))
  ) with check (
    exists (select 1 from public.visits v where v.id = visit_items.visit_id and public.can_see_visit(v))
  );

drop policy if exists visit_items_delete on public.visit_items;
create policy visit_items_delete on public.visit_items
  for delete using (
    exists (select 1 from public.visits v where v.id = visit_items.visit_id and public.can_see_visit(v))
  );

-- ---------------------------------------------------------------------------
-- order_intents
-- ---------------------------------------------------------------------------

alter table public.order_intents enable row level security;

drop policy if exists order_intents_select on public.order_intents;
create policy order_intents_select on public.order_intents
  for select using (public.can_see_order_intent(order_intents));

drop policy if exists order_intents_insert on public.order_intents;
create policy order_intents_insert on public.order_intents
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and (rep_id = public.current_profile_id() or created_by = public.current_profile_id()))
  );

drop policy if exists order_intents_update on public.order_intents;
create policy order_intents_update on public.order_intents
  for update using (public.can_see_order_intent(order_intents))
  with check (public.can_see_order_intent(order_intents));

drop policy if exists order_intents_delete on public.order_intents;
create policy order_intents_delete on public.order_intents
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_intent_items (inherit order intent visibility)
-- ---------------------------------------------------------------------------

alter table public.order_intent_items enable row level security;

drop policy if exists order_intent_items_select on public.order_intent_items;
create policy order_intent_items_select on public.order_intent_items
  for select using (
    exists (select 1 from public.order_intents o where o.id = order_intent_items.order_intent_id and public.can_see_order_intent(o))
  );

drop policy if exists order_intent_items_insert on public.order_intent_items;
create policy order_intent_items_insert on public.order_intent_items
  for insert with check (
    exists (select 1 from public.order_intents o where o.id = order_intent_items.order_intent_id and public.can_see_order_intent(o))
  );

drop policy if exists order_intent_items_update on public.order_intent_items;
create policy order_intent_items_update on public.order_intent_items
  for update using (
    exists (select 1 from public.order_intents o where o.id = order_intent_items.order_intent_id and public.can_see_order_intent(o))
  ) with check (
    exists (select 1 from public.order_intents o where o.id = order_intent_items.order_intent_id and public.can_see_order_intent(o))
  );

drop policy if exists order_intent_items_delete on public.order_intent_items;
create policy order_intent_items_delete on public.order_intent_items
  for delete using (
    exists (select 1 from public.order_intents o where o.id = order_intent_items.order_intent_id and public.can_see_order_intent(o))
  );

-- ---------------------------------------------------------------------------
-- competitor_observations
-- ---------------------------------------------------------------------------

alter table public.competitor_observations enable row level security;

drop policy if exists competitor_observations_select on public.competitor_observations;
create policy competitor_observations_select on public.competitor_observations
  for select using (public.can_see_competitor_observation(competitor_observations));

drop policy if exists competitor_observations_insert on public.competitor_observations;
create policy competitor_observations_insert on public.competitor_observations
  for insert with check (
    public.is_admin()
    or public.is_territory_manager()
    or (public.is_sales_rep() and rep_id = public.current_profile_id())
  );

drop policy if exists competitor_observations_update on public.competitor_observations;
create policy competitor_observations_update on public.competitor_observations
  for update using (public.can_see_competitor_observation(competitor_observations))
  with check (public.can_see_competitor_observation(competitor_observations));

drop policy if exists competitor_observations_delete on public.competitor_observations;
create policy competitor_observations_delete on public.competitor_observations
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- alerts
-- ---------------------------------------------------------------------------

alter table public.alerts enable row level security;

drop policy if exists alerts_select on public.alerts;
create policy alerts_select on public.alerts
  for select using (public.can_see_alert(alerts));

drop policy if exists alerts_insert on public.alerts;
create policy alerts_insert on public.alerts
  for insert with check (public.is_admin() or public.is_territory_manager());

drop policy if exists alerts_update on public.alerts;
create policy alerts_update on public.alerts
  for update using (public.can_see_alert(alerts)) with check (public.can_see_alert(alerts));

drop policy if exists alerts_delete on public.alerts;
create policy alerts_delete on public.alerts
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- updated_at triggers on all mutable tables
-- ---------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists territories_set_updated_at on public.territories;
create trigger territories_set_updated_at before update on public.territories
  for each row execute function public.set_updated_at();

drop trigger if exists reps_set_updated_at on public.reps;
create trigger reps_set_updated_at before update on public.reps
  for each row execute function public.set_updated_at();

drop trigger if exists retailers_set_updated_at on public.retailers;
create trigger retailers_set_updated_at before update on public.retailers
  for each row execute function public.set_updated_at();

drop trigger if exists routes_set_updated_at on public.routes;
create trigger routes_set_updated_at before update on public.routes
  for each row execute function public.set_updated_at();

drop trigger if exists visits_set_updated_at on public.visits;
create trigger visits_set_updated_at before update on public.visits
  for each row execute function public.set_updated_at();

drop trigger if exists order_intents_set_updated_at on public.order_intents;
create trigger order_intents_set_updated_at before update on public.order_intents
  for each row execute function public.set_updated_at();

drop trigger if exists alerts_set_updated_at on public.alerts;
create trigger alerts_set_updated_at before update on public.alerts
  for each row execute function public.set_updated_at();
