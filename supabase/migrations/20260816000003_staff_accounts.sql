-- NiceOS: production staff accounts.
-- Removes the demo-era auth users (admin, manager, kevin) and their
-- identities/sessions. Creates:
--   - Mkombozi (Chairman, NICE MILLERS LIMITED) as super_admin
--   - one zone supervisor (territory_manager) per zone, named by zone
-- Accounts created with the same pattern as admin_create_user (auth.user +
-- auth.identities + profile) so email/password login works.
-- Password for all staff accounts below: yeW9HwbdxJqeI3!
-- CEO account (ceo@niceos.co.ke) is preserved.

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1) Remove demo-era auth users (admin, manager, kevin)
-- ---------------------------------------------------------------------------

do $$
declare
  v_user_ids uuid[] := array(
    select id from auth.users
    where email in ('admin@niceos.co.ke', 'manager@niceos.co.ke', 'kevin.otieno@niceos.co.ke')
  );
begin
  if array_length(v_user_ids, 1) is null then
    raise notice 'No demo-era auth users to remove.';
    return;
  end if;

  delete from auth.identities    where user_id = any (v_user_ids);
  delete from auth.refresh_tokens where user_id = any (v_user_ids::text[]);
  delete from auth.sessions      where user_id = any (v_user_ids);
  delete from auth.users         where id = any (v_user_ids);
end $$;

-- ---------------------------------------------------------------------------
-- 2) Mkombozi — super admin (Chairman)
-- ---------------------------------------------------------------------------

do $$
declare
  v_auth_id uuid;
  v_email text := 'mkombozi@niceos.co.ke';
  v_password text := 'yeW9HwbdxJqeI3!';
begin
  if exists (select 1 from auth.users where email = v_email) then
    raise notice 'Mkombozi already exists, skipping.';
    return;
  end if;

  v_auth_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_auth_id, 'authenticated', 'authenticated',
    v_email, extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Mkombozi (Chairman)", "role": "super_admin"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', now(), '', now(), '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    v_auth_id::text, v_auth_id,
    jsonb_build_object('sub', v_auth_id::text, 'email', v_email),
    'email', now(), now(), now()
  );

  -- The on_auth_user_created trigger already created/updated the profile;
  -- finish it with the role details.
  update public.profiles
     set email = v_email,
         full_name = 'Mkombozi (Chairman)',
         role = 'super_admin',
         status = 'active'
   where auth_id = v_auth_id;

  raise notice 'Created super admin %', v_email;
end $$;

-- ---------------------------------------------------------------------------
-- 3) Zone supervisors — one per zone, named by zone
-- ---------------------------------------------------------------------------

do $$
declare
  v_auth_id uuid;
  v_email text;
  v_zone text;
  v_territory_id uuid;
  v_password text := 'yeW9HwbdxJqeI3!';
begin
  for v_zone in select name from public.territories where level = 'sales_territory' order by name loop
    v_email := format('supervisor.%s@niceos.co.ke', lower(replace(v_zone, ' ', '-')));
    if exists (select 1 from auth.users where email = v_email) then
      raise notice '% already exists, skipping.', v_email;
      continue;
    end if;

    v_auth_id := gen_random_uuid();
    select id into v_territory_id from public.territories where name = v_zone;

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
      is_super_admin, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_auth_id, 'authenticated', 'authenticated',
      v_email, extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(), now(),
      jsonb_build_object('full_name', format('%s Zone Supervisor', v_zone), 'role', 'territory_manager', 'zone', v_zone),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      false, '', now(), '', now(), '', ''
    );

    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      v_auth_id::text, v_auth_id,
      jsonb_build_object('sub', v_auth_id::text, 'email', v_email),
      'email', now(), now(), now()
    );

    -- The on_auth_user_created trigger already created/updated the profile;
    -- finish it with the zone details.
    update public.profiles
       set email = v_email,
           full_name = format('%s Zone Supervisor', v_zone),
           role = 'territory_manager',
           zone = v_zone,
           territory_id = v_territory_id,
           status = 'active'
     where auth_id = v_auth_id;

    raise notice 'Created zone supervisor % (zone %)', v_email, v_zone;
  end loop;
end $$;