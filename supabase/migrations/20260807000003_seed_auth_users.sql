-- NiceOS: create real auth.users for the 4 seed profiles.
-- This allows live email+password login in production.
-- Password for all demo users: NiceOS2026!
-- In production, users should reset their passwords on first login.

set search_path = public;

DO $$
DECLARE
  v_admin_id    uuid := '10000000-0000-4000-8000-000000000001';
  v_manager_id  uuid := '10000000-0000-4000-8000-000000000002';
  v_kevin_id    uuid := '20000000-0000-4000-8000-000000000001';
  v_ceo_id      uuid := '30000000-0000-4000-8000-000000000001';

  -- Password hash for "NiceOS2026!" using pgcrypto's crypt + gen_salt
  v_password    text := 'NiceOS2026!';
  v_email       text;
  v_full_name   text;
  v_role        text;
  v_profile_id  uuid;
  v_auth_id     uuid;
BEGIN
  -- Only create if no auth users exist yet (idempotent)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@niceos.co.ke') THEN
    RAISE NOTICE 'Auth users already exist, skipping.';
    RETURN;
  END IF;

  -- For each seed profile, create an auth.user and link it.
  -- We use auth.admin.create_user (requires service_role) or direct insert.
  -- Since we're in a migration (service_role context), we insert directly.

  -- Admin
  v_auth_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_auth_id, 'authenticated', 'authenticated',
    'admin@niceos.co.ke', crypt(v_password, gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "System Admin", "role": "admin"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', now(), '', now(), '', ''
  );
  -- Link to existing profile
  UPDATE public.profiles SET auth_id = v_auth_id WHERE id = v_admin_id;

  -- Territory Manager
  v_auth_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_auth_id, 'authenticated', 'authenticated',
    'manager@niceos.co.ke', crypt(v_password, gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Grace Kamau", "role": "territory_manager", "zone": "Central"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', now(), '', now(), '', ''
  );
  UPDATE public.profiles SET auth_id = v_auth_id WHERE id = v_manager_id;

  -- Sales Rep (Kevin)
  v_auth_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_auth_id, 'authenticated', 'authenticated',
    'kevin.otieno@niceos.co.ke', crypt(v_password, gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "Kevin Otieno", "role": "sales_rep", "zone": "Central"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', now(), '', now(), '', ''
  );
  UPDATE public.profiles SET auth_id = v_auth_id WHERE id = v_kevin_id;

  -- CEO
  v_auth_id := gen_random_uuid();
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_auth_id, 'authenticated', 'authenticated',
    'ceo@niceos.co.ke', crypt(v_password, gen_salt('bf')),
    now(), now(), now(),
    '{"full_name": "CEO, Nice Limited", "role": "ceo"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', now(), '', now(), '', ''
  );
  UPDATE public.profiles SET auth_id = v_auth_id WHERE id = v_ceo_id;

  RAISE NOTICE 'Auth users created for: admin@niceos.co.ke, manager@niceos.co.ke, kevin.otieno@niceos.co.ke, ceo@niceos.co.ke (password: NiceOS2026!)';
END $$;
