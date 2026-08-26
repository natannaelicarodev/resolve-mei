create table if not exists public.quote_counters (
  business_id uuid primary key references public.businesses(id) on delete restrict,
  next_number integer not null default 1 check (next_number > 0)
);

create table if not exists public.quotes (
  id uuid primary key default extensions.gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  quote_number integer not null check (quote_number > 0),
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'approved', 'rejected', 'canceled')
  ),
  issued_on date not null default current_date,
  valid_until date not null check (valid_until >= issued_on),
  subtotal_cents bigint not null check (subtotal_cents >= 0),
  discount_cents bigint not null default 0 check (
    discount_cents >= 0 and discount_cents <= subtotal_cents
  ),
  total_cents bigint not null check (
    total_cents >= 0 and total_cents = subtotal_cents - discount_cents
  ),
  notes text check (notes is null or char_length(notes) <= 4000),
  client_name_snapshot text not null check (
    char_length(btrim(client_name_snapshot)) between 2 and 160
  ),
  client_document_snapshot text,
  client_phone_snapshot text,
  client_email_snapshot text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotes_business_number_uidx unique (business_id, quote_number)
);

create table if not exists public.quote_items (
  id uuid primary key default extensions.gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  name_snapshot text not null check (
    char_length(btrim(name_snapshot)) between 2 and 160
  ),
  description_snapshot text check (
    description_snapshot is null or char_length(description_snapshot) <= 2000
  ),
  quantity integer not null check (quantity > 0 and quantity <= 1000000),
  unit_price_cents bigint not null check (
    unit_price_cents >= 0 and unit_price_cents <= 9000000000000
  ),
  item_total_cents bigint not null check (
    item_total_cents >= 0
    and item_total_cents = quantity::bigint * unit_price_cents
  ),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_items_quote_position_uidx unique (quote_id, position)
);

create index if not exists quotes_business_created_id_idx
on public.quotes (business_id, created_at desc, id desc);

create index if not exists quotes_business_status_created_id_idx
on public.quotes (business_id, status, created_at desc, id desc);

create index if not exists quotes_business_number_idx
on public.quotes (business_id, quote_number);

create index if not exists quotes_business_client_name_idx
on public.quotes (business_id, lower(client_name_snapshot) text_pattern_ops);

create index if not exists quote_items_quote_position_idx
on public.quote_items (quote_id, position);

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

drop trigger if exists quote_items_set_updated_at on public.quote_items;
create trigger quote_items_set_updated_at
before update on public.quote_items
for each row execute function public.set_updated_at();

alter table public.quote_counters enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

drop policy if exists quotes_select_own_business on public.quotes;
create policy quotes_select_own_business
on public.quotes for select to authenticated
using (
  exists (
    select 1 from public.businesses
    where public.businesses.id = public.quotes.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

drop policy if exists quotes_insert_own_business on public.quotes;
create policy quotes_insert_own_business
on public.quotes for insert to authenticated
with check (
  exists (
    select 1 from public.businesses
    where public.businesses.id = public.quotes.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

drop policy if exists quotes_update_own_business on public.quotes;
create policy quotes_update_own_business
on public.quotes for update to authenticated
using (
  exists (
    select 1 from public.businesses
    where public.businesses.id = public.quotes.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.businesses
    where public.businesses.id = public.quotes.business_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

drop policy if exists quote_items_select_own_business on public.quote_items;
create policy quote_items_select_own_business
on public.quote_items for select to authenticated
using (
  exists (
    select 1
    from public.quotes
    join public.businesses on public.businesses.id = public.quotes.business_id
    where public.quotes.id = public.quote_items.quote_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

drop policy if exists quote_items_insert_own_business on public.quote_items;
create policy quote_items_insert_own_business
on public.quote_items for insert to authenticated
with check (
  exists (
    select 1
    from public.quotes
    join public.businesses on public.businesses.id = public.quotes.business_id
    where public.quotes.id = public.quote_items.quote_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

drop policy if exists quote_items_update_own_business on public.quote_items;
create policy quote_items_update_own_business
on public.quote_items for update to authenticated
using (
  exists (
    select 1
    from public.quotes
    join public.businesses on public.businesses.id = public.quotes.business_id
    where public.quotes.id = public.quote_items.quote_id
      and public.businesses.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.quotes
    join public.businesses on public.businesses.id = public.quotes.business_id
    where public.quotes.id = public.quote_items.quote_id
      and public.businesses.owner_id = (select auth.uid())
  )
);

create or replace function public.save_quote(
  p_business_id uuid,
  p_client_id uuid,
  p_valid_until date,
  p_discount_cents bigint,
  p_notes text,
  p_status text,
  p_items jsonb,
  p_quote_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quote public.quotes;
  v_client public.clients;
  v_item jsonb;
  v_service public.services;
  v_number integer;
  v_subtotal bigint := 0;
  v_quantity integer;
  v_unit bigint;
  v_position integer := 0;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;

  select * into v_client from public.clients
  where id = p_client_id and business_id = p_business_id;
  if not found then raise exception 'CLIENT_NOT_OWNED' using errcode = '42501'; end if;
  if p_status not in ('draft', 'sent') then raise exception 'INVALID_INITIAL_STATUS'; end if;
  if p_valid_until < current_date then raise exception 'INVALID_VALIDITY'; end if;
  if p_discount_cents < 0 then raise exception 'INVALID_DISCOUNT'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'QUOTE_REQUIRES_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit := (v_item ->> 'unit_price_cents')::bigint;
    if v_quantity <= 0 or v_quantity > 1000000 or v_unit < 0 or v_unit > 9000000000000 then
      raise exception 'INVALID_ITEM_VALUE';
    end if;
    if char_length(btrim(coalesce(v_item ->> 'name', ''))) not between 2 and 160 then
      raise exception 'INVALID_ITEM_NAME';
    end if;
    if char_length(coalesce(v_item ->> 'description', '')) > 2000 then
      raise exception 'INVALID_ITEM_DESCRIPTION';
    end if;
    if nullif(v_item ->> 'service_id', '') is not null then
      select * into v_service from public.services
      where id = (v_item ->> 'service_id')::uuid and business_id = p_business_id;
      if not found then raise exception 'SERVICE_NOT_OWNED' using errcode = '42501'; end if;
    end if;
    v_subtotal := v_subtotal + v_quantity::bigint * v_unit;
    if v_subtotal > 9000000000000 then raise exception 'QUOTE_TOTAL_TOO_LARGE'; end if;
  end loop;
  if p_discount_cents > v_subtotal then raise exception 'INVALID_DISCOUNT'; end if;

  if p_quote_id is null then
    insert into public.quote_counters (business_id, next_number)
    values (p_business_id, 2)
    on conflict (business_id) do update
      set next_number = public.quote_counters.next_number + 1
    returning next_number - 1 into v_number;

    insert into public.quotes (
      business_id, client_id, quote_number, status, valid_until,
      subtotal_cents, discount_cents, total_cents, notes,
      client_name_snapshot, client_document_snapshot,
      client_phone_snapshot, client_email_snapshot
    ) values (
      p_business_id, p_client_id, v_number, p_status, p_valid_until,
      v_subtotal, p_discount_cents, v_subtotal - p_discount_cents,
      nullif(btrim(p_notes), ''), v_client.name, v_client.document,
      v_client.phone, v_client.email
    ) returning * into v_quote;
  else
    select * into v_quote from public.quotes
    where id = p_quote_id and business_id = p_business_id for update;
    if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
    if v_quote.status <> 'draft' then raise exception 'QUOTE_NOT_EDITABLE'; end if;
    update public.quotes set
      client_id = p_client_id, status = p_status, valid_until = p_valid_until,
      subtotal_cents = v_subtotal, discount_cents = p_discount_cents,
      total_cents = v_subtotal - p_discount_cents,
      notes = nullif(btrim(p_notes), ''), client_name_snapshot = v_client.name,
      client_document_snapshot = v_client.document,
      client_phone_snapshot = v_client.phone, client_email_snapshot = v_client.email
    where id = v_quote.id returning * into v_quote;
    delete from public.quote_items where quote_id = v_quote.id;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit := (v_item ->> 'unit_price_cents')::bigint;
    insert into public.quote_items (
      quote_id, service_id, name_snapshot, description_snapshot,
      quantity, unit_price_cents, item_total_cents, position
    ) values (
      v_quote.id, nullif(v_item ->> 'service_id', '')::uuid,
      btrim(v_item ->> 'name'), nullif(btrim(v_item ->> 'description'), ''),
      v_quantity, v_unit, v_quantity::bigint * v_unit, v_position
    );
    v_position := v_position + 1;
  end loop;

  return to_jsonb(v_quote) || jsonb_build_object(
    'items', (select coalesce(jsonb_agg(to_jsonb(i) order by i.position), '[]'::jsonb)
      from public.quote_items i where i.quote_id = v_quote.id)
  );
end;
$$;

create or replace function public.transition_quote(
  p_business_id uuid,
  p_quote_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_quote public.quotes;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_quote from public.quotes
  where id = p_quote_id and business_id = p_business_id for update;
  if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  if not (
    v_quote.status <> 'sent' or v_quote.valid_until >= current_date
  ) then raise exception 'QUOTE_EXPIRED'; end if;
  if not (
    (v_quote.status = 'draft' and p_status in ('sent', 'canceled')) or
    (v_quote.status = 'sent' and p_status in ('approved', 'rejected', 'canceled'))
  ) then raise exception 'INVALID_STATUS_TRANSITION'; end if;
  update public.quotes set status = p_status where id = v_quote.id returning * into v_quote;
  return to_jsonb(v_quote);
end;
$$;

create or replace function public.duplicate_quote(
  p_business_id uuid,
  p_quote_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_source public.quotes; v_copy public.quotes; v_number integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_source from public.quotes
  where id = p_quote_id and business_id = p_business_id;
  if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  insert into public.quote_counters (business_id, next_number) values (p_business_id, 2)
  on conflict (business_id) do update set next_number = public.quote_counters.next_number + 1
  returning next_number - 1 into v_number;
  insert into public.quotes (
    business_id, client_id, quote_number, status, issued_on, valid_until,
    subtotal_cents, discount_cents, total_cents, notes,
    client_name_snapshot, client_document_snapshot,
    client_phone_snapshot, client_email_snapshot
  ) select business_id, client_id, v_number, 'draft', current_date, current_date + 7,
    subtotal_cents, discount_cents, total_cents, notes,
    client_name_snapshot, client_document_snapshot,
    client_phone_snapshot, client_email_snapshot
  from public.quotes where id = v_source.id returning * into v_copy;
  insert into public.quote_items (
    quote_id, service_id, name_snapshot, description_snapshot,
    quantity, unit_price_cents, item_total_cents, position
  ) select v_copy.id, service_id, name_snapshot, description_snapshot,
    quantity, unit_price_cents, item_total_cents, position
  from public.quote_items where quote_id = v_source.id order by position;
  return to_jsonb(v_copy) || jsonb_build_object(
    'items', (select coalesce(jsonb_agg(to_jsonb(i) order by i.position), '[]'::jsonb)
      from public.quote_items i where i.quote_id = v_copy.id)
  );
end;
$$;

revoke all privileges on table public.quote_counters from public, anon, authenticated;
revoke all privileges on table public.quotes from public, anon, authenticated;
revoke all privileges on table public.quote_items from public, anon, authenticated;
grant select on table public.quotes to authenticated;
grant select on table public.quote_items to authenticated;

revoke execute on function public.save_quote(uuid, uuid, date, bigint, text, text, jsonb, uuid) from public, anon;
revoke execute on function public.transition_quote(uuid, uuid, text) from public, anon;
revoke execute on function public.duplicate_quote(uuid, uuid) from public, anon;
grant execute on function public.save_quote(uuid, uuid, date, bigint, text, text, jsonb, uuid) to authenticated;
grant execute on function public.transition_quote(uuid, uuid, text) to authenticated;
grant execute on function public.duplicate_quote(uuid, uuid) to authenticated;
