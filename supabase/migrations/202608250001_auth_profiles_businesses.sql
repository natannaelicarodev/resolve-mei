create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 160),
  phone text check (phone is null or phone ~ '^[0-9]{10,11}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.businesses (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete restrict,
  business_name text not null check (char_length(trim(business_name)) between 2 and 160),
  document_type text not null check (document_type in ('cpf', 'cnpj')),
  document_number text,
  professional_phone text not null check (professional_phone ~ '^[0-9]{10,11}$'),
  email text not null check (email = lower(email) and position('@' in email) > 1),
  street text not null check (char_length(trim(street)) between 2 and 160),
  number text not null check (char_length(trim(number)) between 1 and 30),
  complement text check (complement is null or char_length(complement) <= 120),
  neighborhood text not null check (char_length(trim(neighborhood)) between 2 and 120),
  city text not null check (char_length(trim(city)) between 2 and 120),
  state text not null check (
    state in ('AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO')
  ),
  postal_code text not null check (postal_code ~ '^[0-9]{8}$'),
  pix_key text check (pix_key is null or char_length(pix_key) <= 160),
  logo_path text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_logo_path_owner check (
    logo_path is null or (
      logo_path !~* '^https?://'
      and logo_path ~ ('^' || owner_id::text || '/[^/]+$')
    )
  ),
  constraint businesses_document_digits check (
    document_number is null or document_number ~ '^[0-9]+$'
  ),
  constraint businesses_document_length check (
    document_number is null or
    (document_type = 'cpf' and char_length(document_number) = 11) or
    (document_type = 'cnpj' and char_length(document_number) = 14)
  )
);

create index if not exists businesses_owner_id_idx on public.businesses(owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 160)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists businesses_select_own on public.businesses;
create policy businesses_select_own
on public.businesses for select to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists businesses_insert_own on public.businesses;
create policy businesses_insert_own
on public.businesses for insert to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists businesses_update_own on public.businesses;
create policy businesses_update_own
on public.businesses for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
