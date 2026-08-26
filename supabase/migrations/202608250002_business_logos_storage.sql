insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-logos',
  'business-logos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists business_logos_select_own on storage.objects;
create policy business_logos_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'business-logos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists business_logos_insert_own on storage.objects;
create policy business_logos_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'business-logos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists business_logos_update_own on storage.objects;
create policy business_logos_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'business-logos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'business-logos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists business_logos_delete_own on storage.objects;
create policy business_logos_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'business-logos'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
