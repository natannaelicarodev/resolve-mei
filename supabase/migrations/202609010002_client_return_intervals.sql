alter table public.client_relationship_profiles
add column expected_return_days integer
check (expected_return_days is null or expected_return_days in (30, 60, 90, 180, 365));

create function public.save_client_return_interval(
  p_business_id uuid, p_client_id uuid, p_expected_return_days integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.client_relationship_profiles;
begin
  if auth.uid() is null or not exists (select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid())
    then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  if not exists (select 1 from public.clients
    where id = p_client_id and business_id = p_business_id)
    then raise exception 'CLIENT_NOT_OWNED' using errcode = '42501'; end if;
  if p_expected_return_days is not null
    and p_expected_return_days not in (30, 60, 90, 180, 365)
    then raise exception 'INVALID_EXPECTED_RETURN_DAYS'; end if;

  insert into public.client_relationship_profiles(
    client_id, business_id, expected_return_days, updated_by
  ) values (p_client_id, p_business_id, p_expected_return_days, auth.uid())
  on conflict (client_id) do update
    set expected_return_days = excluded.expected_return_days,
        updated_by = auth.uid()
  returning * into p;

  return jsonb_build_object(
    'clientId', p.client_id,
    'expectedReturnDays', p.expected_return_days
  );
end; $$;

create or replace function public.get_reconnect_clients(p_business_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_days integer;
begin
  if auth.uid() is null or not exists (select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid())
    then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select coalesce((select reconnect_after_days from public.business_relationship_settings
    where business_id = p_business_id), 90) into v_days;
  return jsonb_build_object('reconnectAfterDays', v_days, 'clients', (
    with completions as (
      select o.client_id, max(ev.created_at) last_completed_at
      from public.service_orders o join public.service_order_events ev on ev.service_order_id = o.id
      where o.business_id = p_business_id and ev.event_type = 'completed' group by o.client_id
    ), candidates as (
      select c.id, c.name, c.phone, x.last_completed_at,
        ((clock_timestamp() at time zone 'America/Sao_Paulo')::date -
          (x.last_completed_at at time zone 'America/Sao_Paulo')::date) days_since,
        p.expected_return_days, coalesce(p.expected_return_days, v_days) effective_return_days,
        coalesce(p.recurring, false) recurring, coalesce(p.priority, false) priority
      from completions x join public.clients c on c.id = x.client_id and c.business_id = p_business_id
      left join public.client_relationship_profiles p on p.client_id = c.id
      where c.status = 'active'
    ) select coalesce(jsonb_agg(jsonb_build_object(
      'id', x.id, 'name', x.name, 'phone', x.phone, 'lastCompletedAt', x.last_completed_at,
      'daysSince', x.days_since, 'recurring', x.recurring, 'priority', x.priority,
      'expectedReturnDays', x.expected_return_days,
      'effectiveReturnDays', x.effective_return_days,
      'usesBusinessDefault', x.expected_return_days is null
    ) order by x.last_completed_at, x.name), '[]'::jsonb)
    from candidates x where x.days_since >= x.effective_return_days
  ));
end; $$;

create or replace function public.get_client_relationship_overview(p_business_id uuid, p_client_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.clients; v_last timestamptz; v_received bigint; v_days integer;
begin
  if auth.uid() is null or not exists (select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid())
    then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into c from public.clients where id = p_client_id and business_id = p_business_id;
  if not found then raise exception 'CLIENT_NOT_OWNED' using errcode = '42501'; end if;
  select coalesce((select reconnect_after_days from public.business_relationship_settings
    where business_id = p_business_id), 90) into v_days;
  select max(ev.created_at) into v_last from public.service_orders o
    join public.service_order_events ev on ev.service_order_id = o.id
    where o.business_id = p_business_id and o.client_id = c.id and ev.event_type = 'completed';
  select coalesce(sum(case when e.entry_type = 'receipt' then e.amount_cents else -e.amount_cents end), 0)
    into v_received from public.quote_financial_entries e join public.quotes q on q.id = e.quote_id
    where e.business_id = p_business_id and q.client_id = c.id;
  return jsonb_build_object(
    'profile', coalesce((select jsonb_build_object(
      'recurring', recurring, 'priority', priority,
      'expectedReturnDays', expected_return_days,
      'effectiveReturnDays', coalesce(expected_return_days, v_days),
      'usesBusinessDefault', expected_return_days is null
    ) from public.client_relationship_profiles where client_id = c.id),
      jsonb_build_object('recurring', false, 'priority', false,
        'expectedReturnDays', null, 'effectiveReturnDays', v_days, 'usesBusinessDefault', true)),
    'lastCompletedAt', v_last,
    'daysSince', case when v_last is null then null else
      (clock_timestamp() at time zone 'America/Sao_Paulo')::date -
      (v_last at time zone 'America/Sao_Paulo')::date end,
    'receivedCents', v_received::text,
    'quotes', (select coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'number', q.quote_number,
      'status', q.status, 'issuedOn', q.issued_on, 'totalCents', q.total_cents::text)
      order by q.issued_on desc, q.quote_number desc), '[]'::jsonb) from public.quotes q
      where q.business_id = p_business_id and q.client_id = c.id),
    'orders', (select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'quoteId', o.quote_id,
      'status', o.status, 'createdAt', o.created_at, 'lastCompletedAt', completion.completed_at,
      'satisfaction', n.satisfaction, 'observation', n.observation, 'noteUpdatedAt', n.updated_at)
      order by coalesce(completion.completed_at, o.created_at) desc), '[]'::jsonb)
      from public.service_orders o left join lateral (select max(ev.created_at) completed_at
        from public.service_order_events ev where ev.service_order_id = o.id and ev.event_type = 'completed') completion on true
      left join public.service_order_relationship_notes n on n.service_order_id = o.id
      where o.business_id = p_business_id and o.client_id = c.id)
  );
end; $$;

revoke execute on function public.save_client_return_interval(uuid,uuid,integer) from public, anon;
grant execute on function public.save_client_return_interval(uuid,uuid,integer) to authenticated;

