create table if not exists public.services (
  id uuid primary key default extensions.gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  name text not null check (
    name = btrim(name)
    and char_length(name) between 2 and 160
  ),
  description text check (
    description is null or char_length(description) between 1 and 2000
  ),
  price_cents integer not null check (price_cents >= 0),
  estimated_duration_minutes integer check (
    estimated_duration_minutes is null
    or estimated_duration_minutes > 0
  ),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists services_business_name_uidx
on public.services (business_id, lower(name));

create index if not exists services_business_created_id_idx
on public.services (business_id, created_at, id);

create index if not exists services_business_status_created_id_idx
on public.services (business_id, status, created_at, id);

create index if not exists services_business_updated_idx
on public.services (business_id, updated_at desc);

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

alter table public.services enable row level security;

drop policy if exists services_select_own_business on public.services;
create policy services_select_own_business
on public.services for select to authenticated
using (
  exists (
    select 1
    from public.businesses
    where public.businesses.id = public.services.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

drop policy if exists services_insert_own_business on public.services;
create policy services_insert_own_business
on public.services for insert to authenticated
with check (
  exists (
    select 1
    from public.businesses
    where public.businesses.id = public.services.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

drop policy if exists services_update_own_business on public.services;
create policy services_update_own_business
on public.services for update to authenticated
using (
  exists (
    select 1
    from public.businesses
    where public.businesses.id = public.services.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.businesses
    where public.businesses.id = public.services.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

grant usage on schema public to authenticated;

revoke all privileges on table public.services from public, anon, authenticated;
grant select, insert on table public.services to authenticated;
grant update (
  name,
  description,
  price_cents,
  estimated_duration_minutes,
  status
) on table public.services to authenticated;
