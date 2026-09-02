create table if not exists public.service_appointments (
  id uuid primary key default extensions.gen_random_uuid(),
  service_order_id uuid not null references public.service_orders(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  scheduled_on date not null,
  scheduled_time time without time zone,
  status text not null check (status in ('scheduled', 'completed', 'rescheduled', 'canceled')),
  note text check (note is null or char_length(note) between 1 and 500),
  resolution_note text check (resolution_note is null or char_length(resolution_note) between 1 and 500),
  rescheduled_from_id uuid references public.service_appointments(id) on delete restrict,
  actor_user_id uuid not null,
  resolved_by_user_id uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status = 'scheduled') = (resolved_at is null))
);

create unique index if not exists service_appointments_one_active_per_order_idx
on public.service_appointments (service_order_id) where status = 'scheduled';
create index if not exists service_appointments_agenda_idx
on public.service_appointments (business_id, scheduled_on, scheduled_time, id)
where status = 'scheduled';
create index if not exists service_appointments_history_idx
on public.service_appointments (service_order_id, created_at, id);

alter table public.service_appointments enable row level security;
drop policy if exists service_appointments_select_owner on public.service_appointments;
create policy service_appointments_select_owner on public.service_appointments
for select to authenticated using (
  exists (select 1 from public.businesses b
    where b.id = service_appointments.business_id and b.owner_id = (select auth.uid()))
);

revoke all on table public.service_appointments from public, anon, authenticated;
grant select on table public.service_appointments to authenticated;

create or replace function public.create_service_appointment(
  p_business_id uuid, p_service_order_id uuid, p_scheduled_on date,
  p_scheduled_time time default null, p_note text default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_order public.service_orders; v_appointment public.service_appointments; v_note text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_order from public.service_orders
    where id = p_service_order_id and business_id = p_business_id for update;
  if not found then raise exception 'SERVICE_ORDER_NOT_OWNED' using errcode = '42501'; end if;
  if v_order.status not in ('pending', 'in_progress', 'paused')
    then raise exception 'SERVICE_ORDER_TERMINAL'; end if;
  if p_scheduled_on is null or p_scheduled_on < (clock_timestamp() at time zone 'America/Sao_Paulo')::date
    then raise exception 'APPOINTMENT_DATE_IN_PAST'; end if;
  if exists (select 1 from public.service_appointments
    where service_order_id = v_order.id and status = 'scheduled')
    then raise exception 'ACTIVE_APPOINTMENT_EXISTS'; end if;
  v_note := nullif(btrim(regexp_replace(coalesce(p_note, ''), '\s+', ' ', 'g')), '');
  if v_note is not null and char_length(v_note) > 500 then raise exception 'NOTE_TOO_LONG'; end if;
  insert into public.service_appointments(
    service_order_id, business_id, client_id, scheduled_on, scheduled_time,
    status, note, actor_user_id
  ) values (
    v_order.id, v_order.business_id, v_order.client_id, p_scheduled_on,
    p_scheduled_time, 'scheduled', v_note, auth.uid()
  ) returning * into v_appointment;
  return to_jsonb(v_appointment);
end;
$$;

create or replace function public.reschedule_service_appointment(
  p_business_id uuid, p_appointment_id uuid, p_scheduled_on date,
  p_scheduled_time time default null, p_note text default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_current public.service_appointments; v_order public.service_orders;
  v_next public.service_appointments; v_note text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_current from public.service_appointments
    where id = p_appointment_id and business_id = p_business_id for update;
  if not found then raise exception 'APPOINTMENT_NOT_OWNED' using errcode = '42501'; end if;
  if v_current.status <> 'scheduled' then raise exception 'APPOINTMENT_STALE'; end if;
  select * into v_order from public.service_orders
    where id = v_current.service_order_id and business_id = p_business_id for update;
  if v_order.status not in ('pending', 'in_progress', 'paused')
    then raise exception 'SERVICE_ORDER_TERMINAL'; end if;
  if p_scheduled_on is null or p_scheduled_on < (clock_timestamp() at time zone 'America/Sao_Paulo')::date
    then raise exception 'APPOINTMENT_DATE_IN_PAST'; end if;
  v_note := nullif(btrim(regexp_replace(coalesce(p_note, ''), '\s+', ' ', 'g')), '');
  if v_note is not null and char_length(v_note) > 500 then raise exception 'NOTE_TOO_LONG'; end if;
  update public.service_appointments set status = 'rescheduled', resolved_at = clock_timestamp(),
    resolved_by_user_id = auth.uid() where id = v_current.id;
  insert into public.service_appointments(
    service_order_id, business_id, client_id, scheduled_on, scheduled_time,
    status, note, rescheduled_from_id, actor_user_id
  ) values (
    v_current.service_order_id, v_current.business_id, v_current.client_id,
    p_scheduled_on, p_scheduled_time, 'scheduled', v_note, v_current.id, auth.uid()
  ) returning * into v_next;
  return to_jsonb(v_next);
end;
$$;

create or replace function public.resolve_service_appointment(
  p_business_id uuid, p_appointment_id uuid, p_status text,
  p_resolution_note text default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_appointment public.service_appointments; v_note text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  if p_status not in ('completed', 'canceled') then raise exception 'INVALID_APPOINTMENT_STATUS'; end if;
  select * into v_appointment from public.service_appointments
    where id = p_appointment_id and business_id = p_business_id for update;
  if not found then raise exception 'APPOINTMENT_NOT_OWNED' using errcode = '42501'; end if;
  if v_appointment.status <> 'scheduled' then raise exception 'APPOINTMENT_STALE'; end if;
  v_note := nullif(btrim(regexp_replace(coalesce(p_resolution_note, ''), '\s+', ' ', 'g')), '');
  if v_note is not null and char_length(v_note) > 500 then raise exception 'NOTE_TOO_LONG'; end if;
  update public.service_appointments set status = p_status, resolution_note = v_note,
    resolved_at = clock_timestamp(), resolved_by_user_id = auth.uid()
    where id = v_appointment.id returning * into v_appointment;
  return to_jsonb(v_appointment);
end;
$$;

create or replace function public.get_agenda_overview(p_business_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_today date := (clock_timestamp() at time zone 'America/Sao_Paulo')::date;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  return jsonb_build_object(
    'today', v_today,
    'appointments', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'serviceOrderId', a.service_order_id, 'scheduledOn', a.scheduled_on,
      'scheduledTime', a.scheduled_time, 'note', a.note,
      'clientName', q.client_name_snapshot, 'quoteNumber', q.quote_number,
      'overdue', a.scheduled_on < v_today
    ) order by a.scheduled_on, a.scheduled_time nulls last, a.id), '[]'::jsonb)
    from public.service_appointments a
    join public.service_orders o on o.id = a.service_order_id
    join public.quotes q on q.id = o.quote_id
    where a.business_id = p_business_id and a.status = 'scheduled'),
    'financialDueToday', (select coalesce(jsonb_agg(jsonb_build_object(
      'quoteId', q.id, 'quoteNumber', q.quote_number, 'clientName', q.client_name_snapshot,
      'balanceCents', (q.total_cents - coalesce(x.received, 0) + coalesce(x.refunded, 0))::text
    ) order by q.quote_number), '[]'::jsonb)
    from public.quote_receivable_settings s
    join public.quotes q on q.id = s.quote_id
    left join (
      select quote_id,
        coalesce(sum(amount_cents) filter (where entry_type = 'receipt'), 0) received,
        coalesce(sum(amount_cents) filter (where entry_type = 'refund'), 0) refunded
      from public.quote_financial_entries group by quote_id
    ) x on x.quote_id = q.id
    where s.business_id = p_business_id and s.due_on = v_today
      and q.status = 'approved'
      and q.total_cents - coalesce(x.received, 0) + coalesce(x.refunded, 0) > 0)
  );
end;
$$;

revoke execute on function public.create_service_appointment(uuid, uuid, date, time, text) from public, anon;
revoke execute on function public.reschedule_service_appointment(uuid, uuid, date, time, text) from public, anon;
revoke execute on function public.resolve_service_appointment(uuid, uuid, text, text) from public, anon;
revoke execute on function public.get_agenda_overview(uuid) from public, anon;
grant execute on function public.create_service_appointment(uuid, uuid, date, time, text) to authenticated;
grant execute on function public.reschedule_service_appointment(uuid, uuid, date, time, text) to authenticated;
grant execute on function public.resolve_service_appointment(uuid, uuid, text, text) to authenticated;
grant execute on function public.get_agenda_overview(uuid) to authenticated;
