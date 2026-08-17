-- NiceOS: Market Link field programme team.
--
-- Replaces the 6 placeholder zone supervisors and the 6 generic territories
-- with the real Market Link (Playmax x Nice Millers) census structure:
--
--   5 clusters (territories)         5 cluster leads (territory_manager)
--   --------------------------------- ------------------------------------
--   ML·C1 Central & CBD              C1 Lead (name to confirm)
--   ML·C2 Northern Belt              Martin Mutuku
--   ML·C3 Eastern Corridor           Nicole Githui
--   ML·C4 South & West               Raphael Kenyatta
--   ML·T1 Thika (regional base)      Sophie Mbaika
--
--   5 field officers (field_rep app accounts): Willys Munyanga (C1),
--   Nelius (C2), Evans Mutune (C3), Erick Kyalo (C4), Peter Owuor (T1).
--
-- Per officer: zone = cluster, wards = the cluster's area list (from the
-- Field Officer Sheet), target_visits_month = 720 (30 outlets/day x 24
-- coverage days per wave), manager_id = their cluster lead.
--
-- Password for all new accounts: yeW9HwbdxJqeI3! (reset after first login).
-- CEO (ceo@niceos.co.ke) and Mkombozi (mkombozi@niceos.co.ke) preserved.

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1) Territories: replace the 6 generic zones with the 5 clusters
-- ---------------------------------------------------------------------------

delete from public.territories
where name in ('Central', 'Northern', 'Eastern', 'South-Eastern', 'Kiambu', 'Kajiado')
  and id not in ('a0000000-0000-4000-8000-000000000011','a0000000-0000-4000-8000-000000000012','a0000000-0000-4000-8000-000000000013','a0000000-0000-4000-8000-000000000014','a0000000-0000-4000-8000-000000000015');

insert into public.territories (id, name, level, zone, target_visits_per_week) values
  ('a0000000-0000-4000-8000-000000000011', 'Central & CBD',     'sales_territory', 'Central & CBD',     180),
  ('a0000000-0000-4000-8000-000000000012', 'Northern Belt',     'sales_territory', 'Northern Belt',     180),
  ('a0000000-0000-4000-8000-000000000013', 'Eastern Corridor',  'sales_territory', 'Eastern Corridor',  180),
  ('a0000000-0000-4000-8000-000000000014', 'South & West',      'sales_territory', 'South & West',      180),
  ('a0000000-0000-4000-8000-000000000015', 'Thika',             'sales_territory', 'Thika',             180)
  on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2) Remove the 6 placeholder zone supervisors
-- ---------------------------------------------------------------------------

do $$
declare
  v_user_ids uuid[] := array(
    select id from auth.users
    where email like 'supervisor.%@niceos.co.ke'
  );
begin
  if array_length(v_user_ids, 1) is null then
    raise notice 'No placeholder supervisors to remove.';
    return;
  end if;

  delete from auth.identities     where user_id = any (v_user_ids);
  delete from auth.refresh_tokens where user_id = any (v_user_ids::text[]);
  delete from auth.sessions       where user_id = any (v_user_ids);
  delete from auth.users          where id = any (v_user_ids);
end $$;

-- ---------------------------------------------------------------------------
-- 3) Cluster leads (territory_manager)
-- ---------------------------------------------------------------------------

do $$
declare
  v_password text := 'yeW9HwbdxJqeI3!';
begin
  -- create each lead (idempotent: skips existing emails)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    t.email,
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    jsonb_build_object('full_name', t.full_name, 'role', 'territory_manager', 'zone', t.zone),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', now(), '', now(), '', ''
  from (values
    ('nicole.githui@niceos.co.ke',   'Nicole Githui',      'Eastern Corridor'),
    ('martin.mutuku@niceos.co.ke',   'Martin Mutuku',      'Northern Belt'),
    ('raphael.kenyatta@niceos.co.ke', 'Raphael Kenyatta',   'South & West'),
    ('sophie.mbaika@niceos.co.ke',   'Sophie Mbaika',      'Thika'),
    ('c1-lead@niceos.co.ke',         'Central & CBD Lead', 'Central & CBD')
  ) as t(email, full_name, zone)
  where not exists (select 1 from auth.users u where u.email = t.email);

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  select
    u.id::text, u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email', now(), now(), now()
  from auth.users u
  join (values
    ('nicole.githui@niceos.co.ke'), ('martin.mutuku@niceos.co.ke'),
    ('raphael.kenyatta@niceos.co.ke'), ('sophie.mbaika@niceos.co.ke'),
    ('c1-lead@niceos.co.ke')
  ) as t(email) on t.email = u.email
  where not exists (select 1 from auth.identities i where i.user_id = u.id);

  -- profiles: created by the on_auth_user_created trigger; finish details.
  update public.profiles p
     set email = t.email,
         full_name = t.full_name,
         role = 'territory_manager',
         zone = t.zone,
         territory_id = tr.id,
         status = 'active'
    from (values
      ('nicole.githui@niceos.co.ke',   'Nicole Githui',      'Eastern Corridor'),
      ('martin.mutuku@niceos.co.ke',   'Martin Mutuku',      'Northern Belt'),
      ('raphael.kenyatta@niceos.co.ke', 'Raphael Kenyatta',   'South & West'),
      ('sophie.mbaika@niceos.co.ke',   'Sophie Mbaika',      'Thika'),
      ('c1-lead@niceos.co.ke',         'Central & CBD Lead', 'Central & CBD')
    ) as t(email, full_name, zone)
    join auth.users u on u.email = t.email
    left join public.territories tr on tr.zone = t.zone
   where p.auth_id = u.id;
end $$;

-- ---------------------------------------------------------------------------
-- 4) Field officers (field_rep) + reps roster
-- ---------------------------------------------------------------------------

do $$
declare
  v_password text := 'yeW9HwbdxJqeI3!';
begin
  -- auth users
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(), 'authenticated', 'authenticated',
    t.email,
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    jsonb_build_object('full_name', t.full_name, 'role', 'sales_rep', 'zone', t.zone),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', now(), '', now(), '', ''
  from (values
    ('willys.munyanga@niceos.co.ke', 'Willys Munyanga', 'Central & CBD'),
    ('nelius@niceos.co.ke',          'Nelius',          'Northern Belt'),
    ('evans.mutune@niceos.co.ke',    'Evans Mutune',    'Eastern Corridor'),
    ('erick.kyalo@niceos.co.ke',     'Erick Kyalo',     'South & West'),
    ('peter.owuor@niceos.co.ke',     'Peter Owuor',     'Thika')
  ) as t(email, full_name, zone)
  where not exists (select 1 from auth.users u where u.email = t.email);

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  )
  select
    u.id::text, u.id,
    jsonb_build_object('sub', u.id::text, 'email', u.email),
    'email', now(), now(), now()
  from auth.users u
  join (values
    ('willys.munyanga@niceos.co.ke'), ('nelius@niceos.co.ke'),
    ('evans.mutune@niceos.co.ke'), ('erick.kyalo@niceos.co.ke'),
    ('peter.owuor@niceos.co.ke')
  ) as t(email) on t.email = u.email
  where not exists (select 1 from auth.identities i where i.user_id = u.id);

  -- profiles (trigger-created; finish details)
  update public.profiles p
     set email = t.email,
         full_name = t.full_name,
         role = 'sales_rep',
         zone = t.zone,
         territory_id = tr.id,
         status = 'active'
    from (values
      ('willys.munyanga@niceos.co.ke', 'Willys Munyanga', 'Central & CBD'),
      ('nelius@niceos.co.ke',          'Nelius',          'Northern Belt'),
      ('evans.mutune@niceos.co.ke',    'Evans Mutune',    'Eastern Corridor'),
      ('erick.kyalo@niceos.co.ke',     'Erick Kyalo',     'South & West'),
      ('peter.owuor@niceos.co.ke',     'Peter Owuor',     'Thika')
    ) as t(email, full_name, zone)
    join auth.users u on u.email = t.email
    left join public.territories tr on tr.zone = t.zone
   where p.auth_id = u.id;

  -- reps roster rows: cluster areas as wards, 720 outlets per wave target,
  -- manager = the rep's cluster lead. reps.id IS the profile id (FK).
  insert into public.reps (id, name, phone, email, color, zone, wards, target_visits_month, status, manager_id)
  select
    p.id, t.full_name, null, t.email, t.color, t.zone, t.wards,
    720, 'active'::rep_status, m.id
  from (values
    ('Willys Munyanga', 'willys.munyanga@niceos.co.ke', 'Central & CBD', '#B33A30',
     array['CBD','River Road','Gikomba','Kamukunji','Ngara','Pangani','Eastleigh','Huruma','Mathare','Korogocho','Dandora']::text[]),
    ('Nelius',          'nelius@niceos.co.ke',          'Northern Belt', '#0A6B62',
     array['Kasarani','Githurai 44 & 45','Mwiki','Zimmerman','Roysambu','Kahawa West','Sukari','Wendani','Thome','Garden Estate','Kiambu Road']::text[]),
    ('Evans Mutune',    'evans.mutune@niceos.co.ke',    'Eastern Corridor', '#8A5E08',
     array['Jogoo Road','Buruburu','Umoja 1 & 2','Kayole','Komarock','Donholm','Kariobangi South','Njiru','Chokaa','Utawala','Mihang''o']::text[]),
    ('Erick Kyalo',     'erick.kyalo@niceos.co.ke',     'South & West', '#24539F',
     array['Pipeline','Embakasi','Tassia','South B & C','Nairobi West','Lang''ata','Kibra','Dagoretti','Kawangware','Westlands','Kangemi']::text[]),
    ('Peter Owuor',     'peter.owuor@niceos.co.ke',     'Thika', '#4E35AC',
     array['Thika Town','Makongeni','Ngoingwa','Kiganjo','Landless','Witeithie','Juja','Kalimoni','Ruiru','Kimbo','Membley']::text[])
  ) as t(full_name, email, zone, color, wards)
  join public.profiles p on p.email = t.email
  left join public.profiles m
    on m.role = 'territory_manager' and m.zone = t.zone
  where not exists (select 1 from public.reps r where r.email = t.email);
end $$;
