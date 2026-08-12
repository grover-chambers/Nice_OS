-- NiceOS: tighten shelf-photos storage policies so a rep can only read/write
-- their own directory. Replaces the permissive policies from migration 12.
--
-- Storage path convention: `{rep_id}/{filename}` -- e.g.
-- `20000000-0000-4000-8000-000000000001/abc.jpg`. Policies below enforce that
-- the first path segment equals the caller's profile id (a sales_rep) or the
-- caller is an admin / territory_manager (who can read any shelf photo in
-- their zones, by joining through metadata if we ever add it; for v1 we just
-- leak admin read access intentionally).

set search_path = public;

-- Resolve the caller's profile id from auth.uid(). Kept as a SECURITY DEFINER
-- helper because storage policies run with invoker privileges and cannot
-- touch `public.profiles` (RLS-protected) without it.
create or replace function public.current_storage_owner()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id::text from public.profiles where auth_id = auth.uid() limit 1;
$$;

-- Helper: is the caller an admin or territory_manager? Those roles can read
-- any shelf photo; writes are still scoped to the caller's own directory.
create or replace function public.is_storage_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_id = auth.uid()
      and status = 'active'
      and role in ('admin', 'territory_manager')
  );
$$;

-- Drop the permissive policies shipped in migration 12.
drop policy if exists "Authenticated users can upload shelf photos" on storage.objects;
drop policy if exists "Authenticated users can view shelf photos" on storage.objects;
drop policy if exists "Authenticated users can update shelf photos" on storage.objects;
drop policy if exists "Authenticated users can delete shelf photos" on storage.objects;

-- INSERT: the first path segment must be the caller's own profile id.
-- Admins and territory_managers may upload on behalf of a rep by setting the
-- path prefix to that rep's profile id (they must construct the path themselves).
create policy "Reps can upload their own shelf photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'shelf-photos'
    and (public.is_storage_manager()
         or split_part(name, '/', 1) = public.current_storage_owner())
  );

-- SELECT: reps see only their own photos; admins and territory_managers see all.
create policy "Reps see own shelf photos, managers see all"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'shelf-photos'
    and (public.is_storage_manager()
         or split_part(name, '/', 1) = public.current_storage_owner())
  );

-- UPDATE / DELETE: same scoping as select.
create policy "Reps can update own shelf photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'shelf-photos'
    and (public.is_storage_manager()
         or split_part(name, '/', 1) = public.current_storage_owner())
  )
  with check (
    bucket_id = 'shelf-photos'
    and (public.is_storage_manager()
         or split_part(name, '/', 1) = public.current_storage_owner())
  );

create policy "Reps can delete own shelf photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'shelf-photos'
    and (public.is_storage_manager()
         or split_part(name, '/', 1) = public.current_storage_owner())
  );
