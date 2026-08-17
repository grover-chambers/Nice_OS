-- NiceOS: purge all seeded/demo field data so the platform starts clean
-- for real field collection. Every row is snapshotted into _quarantine_*
-- tables first (owner-reviewed before final deletion). Staff accounts,
-- territories, sku_catalog and competitor_brands are preserved.

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1) Quarantine snapshots (all rows, since all current data is seed-shaped)
-- ---------------------------------------------------------------------------

drop table if exists _quarantine_retailers;
create table _quarantine_retailers as select * from public.retailers;

drop table if exists _quarantine_reps;
create table _quarantine_reps as select * from public.reps;

drop table if exists _quarantine_visits;
create table _quarantine_visits as select * from public.visits;

drop table if exists _quarantine_routes;
create table _quarantine_routes as select * from public.routes;

drop table if exists _quarantine_orders;
create table _quarantine_orders as select * from public.order_intents;

drop table if exists _quarantine_stock;
create table _quarantine_stock as select * from public.stock_observations;

drop table if exists _quarantine_competitor_obs;
create table _quarantine_competitor_obs as select * from public.competitor_observations;

drop table if exists _quarantine_shelf_photos;
create table _quarantine_shelf_photos as select * from public.shelf_photos;

drop table if exists _quarantine_outlets;
create table _quarantine_outlets as select * from public.outlets;

drop table if exists _quarantine_outlet_contacts;
create table _quarantine_outlet_contacts as select * from public.outlet_contacts;

drop table if exists _quarantine_consumer_intercepts;
create table _quarantine_consumer_intercepts as select * from public.consumer_intercepts;

drop table if exists _quarantine_consent_records;
create table _quarantine_consent_records as select * from public.consent_records;

drop table if exists _quarantine_route_stops;
create table _quarantine_route_stops as select * from public.route_stops;

drop table if exists _quarantine_visit_items;
create table _quarantine_visit_items as select * from public.visit_items;

drop table if exists _quarantine_order_items;
create table _quarantine_order_items as select * from public.order_intent_items;

drop table if exists _quarantine_category_obs;
create table _quarantine_category_obs as select * from public.category_observations;

-- ---------------------------------------------------------------------------
-- 2) Purge — children first (FK-safe order)
-- ---------------------------------------------------------------------------

delete from public.visit_items;
delete from public.shelf_photos;
delete from public.route_stops;
delete from public.order_intent_items;
delete from public.stock_observations;
delete from public.competitor_observations;
delete from public.category_observations;
delete from public.health_scores;
delete from public.opportunities;
delete from public.alerts;
delete from public.back_checks;
delete from public.consent_records;
delete from public.consumer_intercepts;
delete from public.daily_submissions;
delete from public.coverage_logs;
delete from public.outlet_client_links;
delete from public.outlet_contacts;
delete from public.outlets;
delete from public.order_intents;
delete from public.visits;
delete from public.routes;
delete from public.retailers;
delete from public.reps;
delete from public.auth_otp_challenges;

-- ---------------------------------------------------------------------------
-- 3) Sanity: nothing field-shaped remains
-- ---------------------------------------------------------------------------

do $$
declare
  v_retailers bigint := (select count(*) from public.retailers);
  v_reps      bigint := (select count(*) from public.reps);
  v_visits    bigint := (select count(*) from public.visits);
begin
  if v_retailers <> 0 or v_reps <> 0 or v_visits <> 0 then
    raise exception 'Purge incomplete: retailers=%, reps=%, visits=%', v_retailers, v_reps, v_visits;
  end if;
end $$;