-- NiceOS: production roles, settings, and user management.
-- 1) super_admin role added to user_role enum; is_admin()/can_see_rep()
--    treat super_admin as a superset of admin.
-- 2) app_settings: service configuration (WhatsApp, email, orders, sync,
--    updates) editable from the web Settings page — not read-only.
-- 3) role_definitions: predefined use cases per role, shown in the web
--    Users page so user creation is scoped to each team's operation.
-- 4) admin_create_user / admin_reset_password RPCs: super admin + admins
--    create any user; territory managers create sales_rep accounts in
--    their own zone only. Includes the auth.identities row that direct
--    inserts were missing (the admin login 500 root cause).

set search_path = public;

-- ---------------------------------------------------------------------------
-- 1) super_admin role
-- ---------------------------------------------------------------------------

alter type public.user_role add value if not exists 'super_admin';

create or replace function public.is_admin()
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_scope() s where s.role in ('admin', 'super_admin')
  );
$$;

create or replace function public.can_see_rep(r public.reps)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_scope() s
    where s.role in ('admin', 'super_admin')
       or (s.role = 'territory_manager' and (r.id = s.uid or r.manager_id = s.uid or r.zone = any (s.zones)))
       or (s.role = 'sales_rep' and r.id = s.rep_id)
  );
$$;

-- ---------------------------------------------------------------------------
-- 2) app_settings — live service configuration
-- ---------------------------------------------------------------------------

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings
  for select to authenticated using (true);

drop policy if exists app_settings_insert on public.app_settings;
create policy app_settings_insert on public.app_settings
  for insert to authenticated with check (public.is_admin());

drop policy if exists app_settings_update on public.app_settings;
create policy app_settings_update on public.app_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists app_settings_delete on public.app_settings;
create policy app_settings_delete on public.app_settings
  for delete to authenticated using (public.is_admin());

insert into public.app_settings (key, value, description) values
  ('whatsapp.access_token',        '""'::jsonb,            'WhatsApp Cloud API access token (order desk + OTP delivery)'),
  ('whatsapp.phone_number_id',     '""'::jsonb,            'WhatsApp Cloud API phone number ID'),
  ('whatsapp.order_desk_number',   '""'::jsonb,            'Sales department order handling desk WhatsApp number (E.164)'),
  ('order_forwarding.enabled',     'false'::jsonb,         'Forward captured order intents to the order desk via WhatsApp'),
  ('resend.api_key',               '""'::jsonb,            'Resend API key for email delivery'),
  ('resend.from',                  '"NiceOS <otp@niceos.app>"'::jsonb, 'From address for system emails'),
  ('orders.cutoff_time',           '"16:00"'::jsonb,       'Same-day order cutoff (D-1 16:00 -> next-day delivery)'),
  ('orders.delivery_sla_hours',    '24'::jsonb,            'Order-to-delivery SLA in hours'),
  ('sync.pull_interval_min',       '5'::jsonb,             'Mobile sync pull interval (minutes)'),
  ('sync.push_interval_min',       '5'::jsonb,             'Mobile sync push interval (minutes)'),
  ('updates.force_update',         'false'::jsonb,         'Force all clients onto the current release'),
  ('otp.expiry_min',               '10'::jsonb,            'OTP challenge lifetime (minutes)'),
  ('otp.max_attempts',             '5'::jsonb,             'OTP verification attempts before the challenge is burned')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 3) role_definitions — predefined use cases per role
-- ---------------------------------------------------------------------------

create table if not exists public.role_definitions (
  role user_role primary key,
  label text not null,
  description text not null,
  use_cases text[] not null default '{}',
  can_create_roles user_role[] not null default '{}'
);

alter table public.role_definitions enable row level security;

drop policy if exists role_definitions_select on public.role_definitions;
create policy role_definitions_select on public.role_definitions
  for select to authenticated using (true);

insert into public.role_definitions (role, label, description, use_cases, can_create_roles) values
  ('super_admin',
   'Super Admin (Chairman)',
   'Full control of the platform. Creates users, assigns roles, configures services.',
   array['Create and manage all user accounts and roles',
         'Configure services: WhatsApp order desk, email, sync, OTP',
         'View all market data across every zone'],
   array['super_admin','admin','ceo','territory_manager','sales_rep']::user_role[]),
  ('admin',
   'Administrator',
   'Day-to-day system administration.',
   array['Manage user accounts',
         'View all market data across every zone'],
   array['territory_manager','sales_rep']::user_role[]),
  ('ceo',
   'CEO',
   'Enterprise-wide visibility for strategic decisions.',
   array['View market intelligence across all zones',
         'Monitor order-to-delivery performance',
         'Review zone supervisor and rep activity'],
   '{}'::user_role[]),
  ('territory_manager',
   'Zone Supervisor',
   'Runs field operations for a single zone.',
   array['Create field rep accounts for their zone',
         'Supervise and back-check reps in their zone',
         'View orders, shelf presence, and stock for their zone'],
   array['sales_rep']::user_role[]),
  ('sales_rep',
   'Field Sales Rep',
   'Captures field data at the outlet.',
   array['Capture orders and shelf presence',
         'Record stock observations and competitor intel',
         'Collect consumer intercepts with consent + OTP proof',
         'Log visits with geotagged photo evidence'],
   '{}'::user_role[])
on conflict (role) do nothing;

-- ---------------------------------------------------------------------------
-- 4) User management RPCs
-- ---------------------------------------------------------------------------

-- Creates an auth.user (with identity row), profile, and rep row for
-- sales_rep. Super admins/admins create any role; territory managers may
-- only create sales_rep accounts inside their own zone.
create or replace function public.admin_create_user(
  p_email text,
  p_full_name text,
  p_phone text default null,
  p_role user_role default 'sales_rep',
  p_zone text default null,
  p_territory_id uuid default null,
  p_password text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope_uid uuid;
  v_scope_role user_role;
  v_scope_zones text[];
  v_auth_id uuid;
  v_profile_id uuid;
  v_password text := coalesce(p_password, 'NiceOS2026!');
begin
  select uid, role, zones into v_scope_uid, v_scope_role, v_scope_zones
    from public.app_scope();

  if v_scope_uid is null then
    raise exception 'Unauthenticated';
  end if;

  if v_scope_role = 'territory_manager' then
    if p_role <> 'sales_rep' then
      raise exception 'Zone supervisors can only create sales_rep accounts';
    end if;
    if p_zone is distinct from v_scope_zones[1] then
      raise exception 'Zone supervisors may only create users in their own zone';
    end if;
  elsif v_scope_role not in ('admin', 'super_admin') then
    raise exception 'Not authorized to create users';
  end if;

  if p_email is null or p_full_name is null or p_email !~ '@' then
    raise exception 'Valid email and full_name are required';
  end if;

  v_auth_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
    is_super_admin, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_auth_id, 'authenticated', 'authenticated',
    lower(p_email), extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    jsonb_build_object('full_name', p_full_name, 'role', p_role::text, 'zone', p_zone),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    false, '', now(), '', now(), '', ''
  );

  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    v_auth_id::text, v_auth_id,
    jsonb_build_object('sub', v_auth_id::text, 'email', lower(p_email)),
    'email', now(), now(), now()
  );

  -- The on_auth_user_created trigger auto-creates/links the profile row;
  -- finish it with the full account details instead of inserting a second row.
  update public.profiles
     set email = lower(p_email),
         full_name = p_full_name,
         phone = p_phone,
         role = p_role,
         zone = p_zone,
         territory_id = p_territory_id,
         status = 'active'
   where auth_id = v_auth_id
   returning id into v_profile_id;

  if v_profile_id is null then
    raise exception 'Profile was not created for the new user';
  end if;

  if p_role = 'sales_rep' then
    insert into public.reps (id, name, phone, email, zone, manager_id)
    values (
      v_profile_id, p_full_name, p_phone, lower(p_email),
      coalesce(p_zone, v_scope_zones[1]),
      case when v_scope_role = 'territory_manager' then v_scope_uid else null end
    )
    on conflict (id) do update
      set name = excluded.name,
          phone = excluded.phone,
          email = excluded.email,
          zone = excluded.zone,
          manager_id = excluded.manager_id;
  end if;

  return v_profile_id;
end;
$$;

revoke all on function public.admin_create_user(text, text, text, user_role, text, uuid, text) from public, anon;
grant execute on function public.admin_create_user(text, text, text, user_role, text, uuid, text) to authenticated;

-- Resets a user's password. Super admins/admins only.
create or replace function public.admin_reset_password(
  p_email text,
  p_password text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope_uid uuid;
  v_scope_role user_role;
begin
  select uid, role into v_scope_uid, v_scope_role from public.app_scope();
  if v_scope_uid is null or v_scope_role not in ('admin', 'super_admin') then
    raise exception 'Not authorized to reset passwords';
  end if;
  if p_email is null or p_password is null or length(p_password) < 8 then
    raise exception 'Valid email and password (min 8 chars) are required';
  end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf'))
   where lower(email) = lower(p_email);

  delete from auth.refresh_tokens
   where user_id in (select id from auth.users where lower(email) = lower(p_email));
end;
$$;

revoke all on function public.admin_reset_password(text, text) from public, anon;
grant execute on function public.admin_reset_password(text, text) to authenticated;