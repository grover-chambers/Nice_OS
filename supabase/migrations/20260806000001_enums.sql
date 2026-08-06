-- NiceOS: core enums (shared by web admin and mobile app).
-- Idempotent via DO blocks so the set can be re-applied safely.

set search_path = public;

do $$
begin
  create type public.user_role as enum ('admin', 'territory_manager', 'sales_rep', 'ceo');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.retailer_status as enum ('active', 'prospect', 'at-risk', 'churned', 'blocked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.outlet_type as enum ('duka', 'kiosk', 'supermarket', 'wholesaler', 'restaurant', 'chemist');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.retailer_tier as enum ('A', 'B', 'C');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.churn_risk as enum ('low', 'medium', 'high');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.rep_status as enum ('active', 'on-leave', 'inactive');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.territory_level as enum ('region', 'county', 'subcounty', 'ward', 'sales_territory');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.route_status as enum ('draft', 'submitted', 'approved', 'in-progress', 'completed', 'needs-revision');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.route_priority as enum ('high', 'medium', 'low');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.visit_type as enum ('retail', 'order-collection', 'stock-check', 'prospecting', 'complaint-resolution');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.visit_status as enum ('completed', 'no-stock', 'closed', 'cancelled', 'missed');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.shelf_level as enum ('full', 'low', 'out');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_forward_status as enum ('pending', 'sent', 'failed', 'acknowledged');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.competitor_activity as enum ('price-drop', 'promo', 'new-listing', 'stockout', 'shelf-share');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.alert_category as enum ('churn', 'competitive', 'stock', 'expiry', 'visit', 'route', 'system');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.alert_severity as enum ('critical', 'warning', 'info');
exception
  when duplicate_object then null;
end $$;
