-- NiceOS: sales reps. A rep IS a profile with role = 'sales_rep'; the reps row
-- carries the operational fields (zone, wards, targets, device, status).
-- manager_id links a rep to their territory manager profile.

set search_path = public;

create table if not exists public.reps (
  id uuid primary key references public.profiles (id) on delete cascade,
  name text not null,
  phone text,
  email text,
  color text not null default '#2563eb',
  zone text not null default 'Central',
  wards text[] not null default '{}',
  target_visits_month integer not null default 96,
  actual_visits_month integer not null default 0,
  on_route boolean not null default false,
  last_sync_at timestamptz,
  device text,
  status public.rep_status not null default 'active',
  manager_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reps_zone on public.reps (zone);
create index if not exists idx_reps_manager on public.reps (manager_id);

-- Link territory primary rep (territories created before reps).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'territories_rep_id_fkey') then
    alter table public.territories
      add constraint territories_rep_id_fkey foreign key (rep_id) references public.reps (id) on delete set null;
  end if;
end $$;

-- Replace the signup handler: also provision a reps row for sales reps.
-- If an auth user signs up with an email that already exists on a seeded
-- profile (auth_id = null), link that profile to the new auth user instead of
-- failing on the email unique constraint.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_role public.user_role;
begin
  v_role := coalesce((new.raw_user_meta_data ->> 'role'), 'sales_rep')::public.user_role;

  update public.profiles
  set auth_id = new.id,
      full_name = coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      role = v_role,
      status = 'active'
  where email = new.email
    and auth_id is null
  returning id into v_profile_id;

  if v_profile_id is null then
    insert into public.profiles (auth_id, email, full_name, role)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      v_role
    )
    returning id into v_profile_id;
  end if;

  if v_role = 'sales_rep' and v_profile_id is not null then
    insert into public.reps (id, name, email, zone, status)
    values (
      v_profile_id,
      coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
      new.email,
      coalesce(nullif(new.raw_user_meta_data ->> 'zone', ''), 'Central'),
      'active'
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
