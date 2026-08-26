alter table public.profiles
add column if not exists avatar_path text;

alter table public.profiles
drop constraint if exists profiles_avatar_path_owner;

alter table public.profiles
add constraint profiles_avatar_path_owner check (
  avatar_path is null or (
    avatar_path !~* '^https?://'
    and avatar_path ~ ('^' || id::text || '/[^/]+$')
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_select_own on storage.objects;
create policy avatars_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and array_length(storage.foldername(name), 1) = 1
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
