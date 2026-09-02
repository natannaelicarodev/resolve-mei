create table if not exists public.service_orders (
  id uuid primary key default extensions.gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  status text not null check (status in ('pending', 'in_progress', 'paused', 'completed', 'canceled')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  canceled_at timestamptz,
  updated_at timestamptz not null default now(),
  check (completed_at is null or started_at is not null),
  check (completed_at is null or completed_at >= started_at),
  check (canceled_at is null or started_at is null or canceled_at >= started_at),
  check ((status = 'pending') = (started_at is null and completed_at is null and canceled_at is null)),
  check (status <> 'completed' or completed_at is not null),
  check ((status = 'canceled') = (canceled_at is not null))
);

-- A canceled attempt may be replaced. A completed service keeps the same order
-- and may be reopened explicitly, but it cannot be duplicated.
create unique index if not exists service_orders_one_non_canceled_per_quote_idx
on public.service_orders (quote_id) where status <> 'canceled';
create index if not exists service_orders_owner_status_idx
on public.service_orders (business_id, status, updated_at desc);

create table if not exists public.service_order_events (
  id bigint generated always as identity primary key,
  service_order_id uuid not null references public.service_orders(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  event_type text not null check (event_type in ('created', 'started', 'paused', 'resumed', 'completed', 'reopened', 'canceled', 'note')),
  from_status text check (from_status is null or from_status in ('pending', 'in_progress', 'paused', 'completed', 'canceled')),
  to_status text check (to_status is null or to_status in ('pending', 'in_progress', 'paused', 'completed', 'canceled')),
  note text check (note is null or char_length(note) between 1 and 2000),
  actor_user_id uuid not null,
  created_at timestamptz not null default now(),
  check ((event_type = 'note') = (to_status is null)),
  check (event_type not in ('canceled', 'reopened') or char_length(note) between 2 and 500)
);

create index if not exists service_order_events_timeline_idx
on public.service_order_events (service_order_id, created_at, id);

drop trigger if exists service_orders_set_updated_at on public.service_orders;
create trigger service_orders_set_updated_at before update on public.service_orders
for each row execute function public.set_updated_at();

alter table public.service_orders enable row level security;
alter table public.service_order_events enable row level security;

drop policy if exists service_orders_select_owner on public.service_orders;
create policy service_orders_select_owner on public.service_orders
for select to authenticated using (
  exists (select 1 from public.businesses b
    where b.id = service_orders.business_id and b.owner_id = (select auth.uid()))
);
drop policy if exists service_order_events_select_owner on public.service_order_events;
create policy service_order_events_select_owner on public.service_order_events
for select to authenticated using (
  exists (select 1 from public.businesses b
    where b.id = service_order_events.business_id and b.owner_id = (select auth.uid()))
);

revoke all on table public.service_orders from public, anon, authenticated;
revoke all on table public.service_order_events from public, anon, authenticated;
grant select on table public.service_orders to authenticated;
grant select on table public.service_order_events to authenticated;

create or replace function public.create_service_order(p_business_id uuid, p_quote_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_quote public.quotes; v_order public.service_orders;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_quote from public.quotes
    where id = p_quote_id and business_id = p_business_id for update;
  if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  if v_quote.status <> 'approved' then raise exception 'QUOTE_NOT_APPROVED'; end if;
  if exists (select 1 from public.service_orders where quote_id = v_quote.id and status <> 'canceled')
    then raise exception 'SERVICE_ORDER_ALREADY_EXISTS'; end if;
  insert into public.service_orders(quote_id, business_id, client_id, status, started_at)
    values (v_quote.id, v_quote.business_id, v_quote.client_id, 'pending', null)
    returning * into v_order;
  insert into public.service_order_events(
    service_order_id, business_id, event_type, from_status, to_status, actor_user_id
  ) values (v_order.id, v_order.business_id, 'created', null, 'pending', auth.uid());
  return to_jsonb(v_order);
end;
$$;

create or replace function public.transition_service_order(
  p_business_id uuid, p_service_order_id uuid, p_expected_status text,
  p_status text, p_reason text default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_order public.service_orders; v_reason text; v_event text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_order from public.service_orders
    where id = p_service_order_id and business_id = p_business_id for update;
  if not found then raise exception 'SERVICE_ORDER_NOT_OWNED' using errcode = '42501'; end if;
  if v_order.status <> p_expected_status then raise exception 'SERVICE_ORDER_STALE'; end if;
  if not ((v_order.status = 'pending' and p_status in ('in_progress', 'canceled')) or
          (v_order.status = 'in_progress' and p_status in ('paused', 'completed', 'canceled')) or
          (v_order.status = 'paused' and p_status in ('in_progress', 'completed', 'canceled')) or
          (v_order.status = 'completed' and p_status = 'in_progress'))
    then raise exception 'INVALID_SERVICE_ORDER_TRANSITION'; end if;
  v_reason := nullif(btrim(regexp_replace(coalesce(p_reason, ''), '\s+', ' ', 'g')), '');
  if p_status = 'canceled' and (v_reason is null or char_length(v_reason) not between 2 and 500)
    then raise exception 'CANCEL_REASON_REQUIRED'; end if;
  if v_order.status = 'completed' and (v_reason is null or char_length(v_reason) not between 2 and 500)
    then raise exception 'REOPEN_REASON_REQUIRED'; end if;
  if v_reason is not null and char_length(v_reason) > 2000 then raise exception 'REASON_TOO_LONG'; end if;
  v_event := case
    when v_order.status = 'pending' and p_status = 'in_progress' then 'started'
    when v_order.status = 'completed' and p_status = 'in_progress' then 'reopened'
    when p_status = 'paused' then 'paused' when p_status = 'in_progress' then 'resumed'
    when p_status = 'completed' then 'completed' else 'canceled' end;
  update public.service_orders set status = p_status,
    started_at = case when v_order.status = 'pending' and p_status = 'in_progress'
      then clock_timestamp() else v_order.started_at end,
    completed_at = case when p_status = 'completed' then clock_timestamp() else v_order.completed_at end,
    canceled_at = case when p_status = 'canceled' then clock_timestamp() else null end
    where id = v_order.id returning * into v_order;
  insert into public.service_order_events(
    service_order_id, business_id, event_type, from_status, to_status, note, actor_user_id
  ) values (v_order.id, v_order.business_id, v_event, p_expected_status, p_status, v_reason, auth.uid());
  return to_jsonb(v_order);
end;
$$;

create or replace function public.add_service_order_note(
  p_business_id uuid, p_service_order_id uuid, p_note text
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_order public.service_orders; v_note text; v_event public.service_order_events;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_order from public.service_orders
    where id = p_service_order_id and business_id = p_business_id for update;
  if not found then raise exception 'SERVICE_ORDER_NOT_OWNED' using errcode = '42501'; end if;
  if v_order.status not in ('in_progress', 'paused') then raise exception 'SERVICE_ORDER_NOT_ACTIVE'; end if;
  v_note := btrim(regexp_replace(coalesce(p_note, ''), '\s+', ' ', 'g'));
  if char_length(v_note) not between 1 and 2000 then raise exception 'INVALID_NOTE'; end if;
  insert into public.service_order_events(
    service_order_id, business_id, event_type, from_status, to_status, note, actor_user_id
  ) values (v_order.id, v_order.business_id, 'note', v_order.status, null, v_note, auth.uid())
    returning * into v_event;
  return to_jsonb(v_event);
end;
$$;

revoke execute on function public.create_service_order(uuid, uuid) from public, anon;
revoke execute on function public.transition_service_order(uuid, uuid, text, text, text) from public, anon;
revoke execute on function public.add_service_order_note(uuid, uuid, text) from public, anon;
grant execute on function public.create_service_order(uuid, uuid) to authenticated;
grant execute on function public.transition_service_order(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.add_service_order_note(uuid, uuid, text) to authenticated;
