-- NiceOS: visit verification by geotagged photos + 2FA (email+password → OTP)
-- support tables.
--
-- 1) shelf_photos gains photo classification (shop_front | shelf) and the GPS
--    geotag captured with the shot, so visits can be audited server-side.
-- 2) visits gains verification_method recording HOW the visit was confirmed
--    (gps+photo | gps | qr | nfc | override).
-- 3) auth_otp_challenges backs the mobile 2FA flow (edge functions
--    `auth-otp` / `auth-verify-otp`).
-- 4) verify_visit_photos() runs after a visit + its photos land on the server
--    and flips gps_verified to true when the evidence is sound.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Photo verification columns
-- ---------------------------------------------------------------------------

alter table public.shelf_photos add column if not exists photo_type text
  check (photo_type in ('shop_front', 'shelf'));
alter table public.shelf_photos add column if not exists lat double precision;
alter table public.shelf_photos add column if not exists lng double precision;
alter table public.shelf_photos add column if not exists accuracy double precision;

create index if not exists idx_shelf_photos_type on public.shelf_photos (visit_id, photo_type);

alter table public.visits add column if not exists verification_method text
  check (verification_method in ('gps+photo', 'gps', 'qr', 'nfc', 'override'));

-- ---------------------------------------------------------------------------
-- 2FA challenge table (edge-function only writes via service_role)
-- ---------------------------------------------------------------------------

create table if not exists public.auth_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_otp_challenges_profile on public.auth_otp_challenges (profile_id, created_at desc);

alter table public.auth_otp_challenges enable row level security;

-- A user may only see their own challenges; writes are restricted to admins
-- (edge functions bypass RLS with the service role).
drop policy if exists auth_otp_challenges_select on public.auth_otp_challenges;
create policy auth_otp_challenges_select on public.auth_otp_challenges
  for select using (
    public.is_admin()
    or profile_id = public.current_profile_id()
  );

drop policy if exists auth_otp_challenges_insert on public.auth_otp_challenges;
create policy auth_otp_challenges_insert on public.auth_otp_challenges
  for insert with check (public.is_admin());

drop policy if exists auth_otp_challenges_update on public.auth_otp_challenges;
create policy auth_otp_challenges_update on public.auth_otp_challenges
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists auth_otp_challenges_delete on public.auth_otp_challenges;
create policy auth_otp_challenges_delete on public.auth_otp_challenges
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- verify_visit_photos(visit_id): server-side audit of photo evidence.
-- Verified when the visit has >= 1 shop_front and >= 1 shelf photo, at least
-- two photos carry geotags, and the mean photo geotag is within `tolerance` m
-- of the retailer pin (indoor shots have worse GPS, hence 25 m).
-- ---------------------------------------------------------------------------

create or replace function public.verify_visit_photos(p_visit_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ret_lat double precision;
  v_ret_lng double precision;
  v_front int := 0;
  v_shelf int := 0;
  v_geo int := 0;
  v_avg_lat double precision;
  v_avg_lng double precision;
  v_dist double precision;
  v_tolerance double precision := 25;
  v_verified boolean;
  v_reason text;
begin
  select r.lat, r.lng
    into v_ret_lat, v_ret_lng
    from public.visits v
    join public.retailers r on r.id = v.retailer_id
   where v.id = p_visit_id;

  if v_ret_lat is null or v_ret_lng is null then
    return jsonb_build_object('verified', false, 'reason', 'visit-or-retailer-not-found');
  end if;

  select
    count(*) filter (where photo_type = 'shop_front'),
    count(*) filter (where photo_type = 'shelf'),
    count(*) filter (where lat is not null and lng is not null),
    avg(lat), avg(lng)
    into v_front, v_shelf, v_geo, v_avg_lat, v_avg_lng
    from public.shelf_photos
   where visit_id = p_visit_id
     and deleted_at is null;

  v_dist := 6371000 * 2 * asin(
    sqrt(
      power(sin(radians(v_avg_lat - v_ret_lat) / 2), 2)
      + cos(radians(v_ret_lat)) * cos(radians(v_avg_lat))
        * power(sin(radians(v_avg_lng - v_ret_lng) / 2), 2)
    )
  );

  v_verified := v_front >= 1 and v_shelf >= 1 and v_geo >= 2 and v_dist <= v_tolerance;
  v_reason := case
    when not v_verified and (v_front < 1 or v_shelf < 1) then 'missing-shop-front-or-shelf-photo'
    when not v_verified and v_geo < 2 then 'not-enough-geotagged-photos'
    when not v_verified then 'geotag-outside-tolerance'
    else 'ok'
  end;

  if v_verified then
    update public.visits
       set gps_verified = true,
           verification_method = 'gps+photo'
     where id = p_visit_id;
  end if;

  return jsonb_build_object(
    'verified', v_verified,
    'reason', v_reason,
    'photos', jsonb_build_object('shop_front', v_front, 'shelf', v_shelf, 'geotagged', v_geo),
    'distance_m', round(coalesce(v_dist, -1)::numeric, 1)
  );
end;
$$;

-- Only the service role may run the audit (invoked by the sync/health edge
-- functions); direct clients cannot self-verify arbitrary visits.
revoke execute on function public.verify_visit_photos(uuid) from public, anon, authenticated;
grant execute on function public.verify_visit_photos(uuid) to service_role;
