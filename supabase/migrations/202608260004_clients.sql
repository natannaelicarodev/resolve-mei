create table if not exists public.clients (
  id uuid primary key default extensions.gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  type text not null check (type in ('person', 'company')),
  name text not null check (char_length(trim(name)) between 2 and 160),
  document text,
  phone text check (phone is null or phone ~ '^[0-9]{10,11}$'),
  email text check (
    email is null or (email = lower(email) and position('@' in email) > 1)
  ),
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_document_format check (
    document is null or (
      document ~ '^[0-9]+$'
      and (
        (type = 'person' and char_length(document) = 11)
        or (type = 'company' and char_length(document) = 14)
      )
    )
  )
);

create unique index if not exists clients_business_document_uidx
on public.clients (business_id, document)
where document is not null;

create index if not exists clients_business_status_updated_idx
on public.clients (business_id, status, updated_at desc);

create index if not exists clients_business_name_idx
on public.clients (business_id, lower(name) text_pattern_ops);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;

drop policy if exists clients_select_own_business on public.clients;
create policy clients_select_own_business
on public.clients for select to authenticated
using (
  exists (
    select 1
    from public.businesses
    where public.businesses.id = public.clients.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

drop policy if exists clients_insert_own_business on public.clients;
create policy clients_insert_own_business
on public.clients for insert to authenticated
with check (
  exists (
    select 1
    from public.businesses
    where public.businesses.id = public.clients.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

drop policy if exists clients_update_own_business on public.clients;
create policy clients_update_own_business
on public.clients for update to authenticated
using (
  exists (
    select 1
    from public.businesses
    where public.businesses.id = public.clients.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.businesses
    where public.businesses.id = public.clients.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

grant usage on schema public to authenticated;

revoke all privileges on table public.clients from public, anon, authenticated;
grant select, insert, update on table public.clients to authenticated;
