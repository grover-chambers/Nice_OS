-- NiceOS: Phase B — CEO executive read access.
--
-- The CEO dashboard (/client) renders live KPIs, zone coverage, a ward map
-- and the competitive landscape. Under Phase A RLS the ceo role resolves a
-- valid scope but matches no SELECT policy, so every table returned 0 rows
-- and the executive view showed nothing.
--
-- The CEO owns the whole dataset, so this migration grants the ceo role
-- SELECT on the core reporting tables (no writes). Aggregate-only views were
-- the original Phase B sketch; in practice the executive map needs ward-level
-- counts computed from the same rows the other dashboards read, so giving the
-- CEO read access to the source tables is the honest, low-duplication design.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Helper predicate: caller is the CEO (or a platform admin, who already has
-- full access).
-- ---------------------------------------------------------------------------

create or replace function public.is_ceo_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.app_scope() s where s.role = 'ceo');
$$;

-- ---------------------------------------------------------------------------
-- retailers
-- ---------------------------------------------------------------------------

drop policy if exists retailers_select_ceo on public.retailers;
create policy retailers_select_ceo on public.retailers
  for select using (public.is_ceo_role());

-- ---------------------------------------------------------------------------
-- reps
-- ---------------------------------------------------------------------------

drop policy if exists reps_select_ceo on public.reps;
create policy reps_select_ceo on public.reps
  for select using (public.is_ceo_role());

-- ---------------------------------------------------------------------------
-- routes
-- ---------------------------------------------------------------------------

drop policy if exists routes_select_ceo on public.routes;
create policy routes_select_ceo on public.routes
  for select using (public.is_ceo_role());

-- ---------------------------------------------------------------------------
-- route_stops (inherit route visibility)
-- ---------------------------------------------------------------------------

drop policy if exists route_stops_select_ceo on public.route_stops;
create policy route_stops_select_ceo on public.route_stops
  for select using (
    exists (select 1 from public.routes r where r.id = route_stops.route_id and public.is_ceo_role())
  );

-- ---------------------------------------------------------------------------
-- visits
-- ---------------------------------------------------------------------------

drop policy if exists visits_select_ceo on public.visits;
create policy visits_select_ceo on public.visits
  for select using (public.is_ceo_role());

-- ---------------------------------------------------------------------------
-- visit_items (inherit visit visibility)
-- ---------------------------------------------------------------------------

drop policy if exists visit_items_select_ceo on public.visit_items;
create policy visit_items_select_ceo on public.visit_items
  for select using (
    exists (select 1 from public.visits v where v.id = visit_items.visit_id and public.is_ceo_role())
  );

-- ---------------------------------------------------------------------------
-- order_intents
-- ---------------------------------------------------------------------------

drop policy if exists order_intents_select_ceo on public.order_intents;
create policy order_intents_select_ceo on public.order_intents
  for select using (public.is_ceo_role());

-- ---------------------------------------------------------------------------
-- order_intent_items (inherit order intent visibility)
-- ---------------------------------------------------------------------------

drop policy if exists order_intent_items_select_ceo on public.order_intent_items;
create policy order_intent_items_select_ceo on public.order_intent_items
  for select using (
    exists (select 1 from public.order_intents o where o.id = order_intent_items.order_intent_id and public.is_ceo_role())
  );

-- ---------------------------------------------------------------------------
-- competitor_observations
-- ---------------------------------------------------------------------------

drop policy if exists competitor_observations_select_ceo on public.competitor_observations;
create policy competitor_observations_select_ceo on public.competitor_observations
  for select using (public.is_ceo_role());

-- ---------------------------------------------------------------------------
-- alerts (read-only, matching the read-only access the other roles have)
-- ---------------------------------------------------------------------------

drop policy if exists alerts_select_ceo on public.alerts;
create policy alerts_select_ceo on public.alerts
  for select using (public.is_ceo_role());

-- ---------------------------------------------------------------------------
-- territories (static directory data — harmless to expose)
-- ---------------------------------------------------------------------------

drop policy if exists territories_select_ceo on public.territories;
create policy territories_select_ceo on public.territories
  for select using (public.is_ceo_role());
