-- ---------------------------------------------------------------------------
-- Over-the-air app releases: a public storage bucket for APKs plus a small
-- table the rep app pings to see if an update is available.
-- ---------------------------------------------------------------------------

-- Public storage bucket for release APKs (readable by anyone with the URL so
-- reps can download updates without signing in).
insert into storage.buckets (id, name, public)
values ('app-releases', 'app-releases', true)
on conflict (id) do nothing;

-- Anyone may read objects in the bucket; only service_role writes.
drop policy if exists "app-releases-public-read" on storage.objects;
create policy "app-releases-public-read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'app-releases');

drop policy if exists "app-releases-admin-write" on storage.objects;
create policy "app-releases-admin-write"
on storage.objects for insert
to service_role
with check (bucket_id = 'app-releases');

drop policy if exists "app-releases-admin-update" on storage.objects;
create policy "app-releases-admin-update"
on storage.objects for update
to service_role
using (bucket_id = 'app-releases');

-- Latest release metadata the app compares against its own version.
create table if not exists public.app_versions (
  id uuid primary key default gen_random_uuid(),
  version_name text not null,          -- e.g. 1.0.1 (shown to the rep)
  version_code integer not null,       -- monotonic integer for comparison
  apk_url text not null,               -- public download URL in the bucket
  notes text,
  is_latest boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.app_versions enable row level security;

-- Any client may read the release manifest (anon), so the app can check for
-- updates without a signed-in rep.
drop policy if exists "app_versions_select" on public.app_versions;
create policy "app_versions_select"
on public.app_versions for select
to anon, authenticated
using (true);

drop policy if exists "app_versions_admin_insert" on public.app_versions;
create policy "app_versions_admin_insert"
on public.app_versions for insert
to service_role
with check (true);

drop policy if exists "app_versions_admin_update" on public.app_versions;
create policy "app_versions_admin_update"
on public.app_versions for update
to service_role
using (true);

drop policy if exists "app_versions_admin_delete" on public.app_versions;
create policy "app_versions_admin_delete"
on public.app_versions for delete
to service_role
using (true);

-- Keep a single "latest" pointer: when a row is inserted with is_latest = true,
-- demote every other row to is_latest = false.
create or replace function public.app_versions_set_latest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_latest then
    update public.app_versions set is_latest = false where id <> new.id;
  end if;
  return new;
end $$;

drop trigger if exists app_versions_latest on public.app_versions;
create trigger app_versions_latest
after insert or update of is_latest on public.app_versions
for each row execute function public.app_versions_set_latest();
