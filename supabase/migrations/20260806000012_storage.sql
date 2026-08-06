-- NiceOS: storage bucket for shelf photos + access policies.

set search_path = public;

insert into storage.buckets (id, name, public)
values ('shelf-photos', 'shelf-photos', false)
on conflict (id) do nothing;

-- Authenticated users can upload into the bucket.
drop policy if exists "Authenticated users can upload shelf photos" on storage.objects;
create policy "Authenticated users can upload shelf photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shelf-photos');

-- Anyone with a scope can view photos in the bucket.
drop policy if exists "Authenticated users can view shelf photos" on storage.objects;
create policy "Authenticated users can view shelf photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'shelf-photos');

-- Owner/rep/manager updates: restrict to authenticated users for now.
drop policy if exists "Authenticated users can update shelf photos" on storage.objects;
create policy "Authenticated users can update shelf photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'shelf-photos');

drop policy if exists "Authenticated users can delete shelf photos" on storage.objects;
create policy "Authenticated users can delete shelf photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shelf-photos');
