-- NiceOS: profiles (the app identity row per auth user) + auto-provisioning
-- trigger on auth.users. Demo/seed profiles may have auth_id = NULL until a
-- real auth user is linked.

set search_path = public;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users (id) on delete cascade,
  email text unique,
  full_name text not null,
  phone text,
  role public.user_role not null default 'sales_rep',
  zone text,
  territory_id uuid,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_auth_id on public.profiles (auth_id);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_zone on public.profiles (zone);

-- Auto-provision a profile (and later, for sales reps, a reps row) whenever a
-- new auth user signs up. Replaces itself in the reps migration.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (auth_id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'role'), 'sales_rep')::public.user_role
  )
  on conflict (auth_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
