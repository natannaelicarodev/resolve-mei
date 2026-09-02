create table public.business_relationship_settings (
  business_id uuid primary key references public.businesses(id) on delete restrict,
  reconnect_after_days integer not null default 90 check (reconnect_after_days between 1 and 3650),
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_relationship_profiles (
  client_id uuid primary key references public.clients(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  recurring boolean not null default false,
  priority boolean not null default false,
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, client_id)
);

create table public.service_order_relationship_notes (
  service_order_id uuid primary key references public.service_orders(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  client_id uuid not null references public.clients(id) on delete restrict,
  satisfaction smallint check (satisfaction between 1 and 5),
  observation text check (observation is null or char_length(observation) between 1 and 2000),
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (satisfaction is not null or observation is not null)
);

create index client_relationship_profiles_business_idx
on public.client_relationship_profiles (business_id, priority desc, recurring desc, client_id);
create index service_order_relationship_notes_client_idx
on public.service_order_relationship_notes (business_id, client_id, updated_at desc);

create trigger business_relationship_settings_set_updated_at before update
on public.business_relationship_settings for each row execute function public.set_updated_at();
create trigger client_relationship_profiles_set_updated_at before update
on public.client_relationship_profiles for each row execute function public.set_updated_at();
create trigger service_order_relationship_notes_set_updated_at before update
on public.service_order_relationship_notes for each row execute function public.set_updated_at();

alter table public.business_relationship_settings enable row level security;
alter table public.client_relationship_profiles enable row level security;
alter table public.service_order_relationship_notes enable row level security;

create policy business_relationship_settings_select_owner on public.business_relationship_settings
for select to authenticated using (exists (select 1 from public.businesses b
  where b.id = business_relationship_settings.business_id and b.owner_id = (select auth.uid())));
create policy client_relationship_profiles_select_owner on public.client_relationship_profiles
for select to authenticated using (exists (select 1 from public.businesses b
  where b.id = client_relationship_profiles.business_id and b.owner_id = (select auth.uid())));
create policy service_order_relationship_notes_select_owner on public.service_order_relationship_notes
for select to authenticated using (exists (select 1 from public.businesses b
  where b.id = service_order_relationship_notes.business_id and b.owner_id = (select auth.uid())));

revoke all on public.business_relationship_settings, public.client_relationship_profiles,
  public.service_order_relationship_notes from public, anon, authenticated;
grant select on public.business_relationship_settings, public.client_relationship_profiles,
  public.service_order_relationship_notes to authenticated;

create function public.save_relationship_settings(p_business_id uuid, p_reconnect_after_days integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.business_relationship_settings;
begin
  if auth.uid() is null or not exists (select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid())
    then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  if p_reconnect_after_days not between 1 and 3650
    then raise exception 'INVALID_RECONNECT_DAYS'; end if;
  insert into public.business_relationship_settings(business_id, reconnect_after_days, updated_by)
  values (p_business_id, p_reconnect_after_days, auth.uid())
  on conflict (business_id) do update set reconnect_after_days = excluded.reconnect_after_days,
    updated_by = auth.uid() returning * into s;
  return jsonb_build_object('reconnectAfterDays', s.reconnect_after_days);
end; $$;

create function public.save_client_relationship_profile(
  p_business_id uuid, p_client_id uuid, p_recurring boolean, p_priority boolean
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.client_relationship_profiles;
begin
  if auth.uid() is null or not exists (select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid())
    then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  if not exists (select 1 from public.clients where id = p_client_id and business_id = p_business_id)
    then raise exception 'CLIENT_NOT_OWNED' using errcode = '42501'; end if;
  insert into public.client_relationship_profiles(client_id, business_id, recurring, priority, updated_by)
  values (p_client_id, p_business_id, coalesce(p_recurring, false), coalesce(p_priority, false), auth.uid())
  on conflict (client_id) do update set recurring = excluded.recurring,
    priority = excluded.priority, updated_by = auth.uid() returning * into p;
  return jsonb_build_object('clientId', p.client_id, 'recurring', p.recurring, 'priority', p.priority);
end; $$;

create function public.save_service_order_relationship_note(
  p_business_id uuid, p_service_order_id uuid, p_satisfaction integer, p_observation text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.service_orders; n public.service_order_relationship_notes; v_observation text;
begin
  if auth.uid() is null or not exists (select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid())
    then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into o from public.service_orders where id = p_service_order_id
    and business_id = p_business_id for update;
  if not found then raise exception 'SERVICE_ORDER_NOT_OWNED' using errcode = '42501'; end if;
  if not exists (select 1 from public.service_order_events where service_order_id = o.id
    and business_id = p_business_id and event_type = 'completed')
    then raise exception 'SERVICE_ORDER_NOT_COMPLETED'; end if;
  if p_satisfaction is not null and p_satisfaction not between 1 and 5
    then raise exception 'INVALID_SATISFACTION'; end if;
  v_observation := nullif(btrim(regexp_replace(coalesce(p_observation, ''), '\s+', ' ', 'g')), '');
  if v_observation is not null and char_length(v_observation) > 2000
    then raise exception 'RELATIONSHIP_NOTE_TOO_LONG'; end if;
  if p_satisfaction is null and v_observation is null
    then raise exception 'RELATIONSHIP_NOTE_REQUIRED'; end if;
  insert into public.service_order_relationship_notes(
    service_order_id, business_id, client_id, satisfaction, observation, created_by, updated_by
  ) values (o.id, o.business_id, o.client_id, p_satisfaction, v_observation, auth.uid(), auth.uid())
  on conflict (service_order_id) do update set satisfaction = excluded.satisfaction,
    observation = excluded.observation, updated_by = auth.uid() returning * into n;
  return jsonb_build_object('serviceOrderId', n.service_order_id, 'satisfaction', n.satisfaction,
    'observation', n.observation, 'updatedAt', n.updated_at);
end; $$;

create function public.get_reconnect_clients(p_business_id uuid)
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
    ) select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'phone', c.phone, 'lastCompletedAt', x.last_completed_at,
      'daysSince', ((clock_timestamp() at time zone 'America/Sao_Paulo')::date -
        (x.last_completed_at at time zone 'America/Sao_Paulo')::date),
      'recurring', coalesce(p.recurring, false), 'priority', coalesce(p.priority, false)
    ) order by x.last_completed_at, c.name), '[]'::jsonb)
    from completions x join public.clients c on c.id = x.client_id and c.business_id = p_business_id
    left join public.client_relationship_profiles p on p.client_id = c.id
    where c.status = 'active' and x.last_completed_at <= clock_timestamp() - make_interval(days => v_days)
  ));
end; $$;

create function public.get_client_relationship_overview(p_business_id uuid, p_client_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.clients; v_last timestamptz; v_received bigint;
begin
  if auth.uid() is null or not exists (select 1 from public.businesses
    where id = p_business_id and owner_id = auth.uid())
    then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into c from public.clients where id = p_client_id and business_id = p_business_id;
  if not found then raise exception 'CLIENT_NOT_OWNED' using errcode = '42501'; end if;
  select max(ev.created_at) into v_last from public.service_orders o
    join public.service_order_events ev on ev.service_order_id = o.id
    where o.business_id = p_business_id and o.client_id = c.id and ev.event_type = 'completed';
  select coalesce(sum(case when e.entry_type = 'receipt' then e.amount_cents else -e.amount_cents end), 0)
    into v_received from public.quote_financial_entries e join public.quotes q on q.id = e.quote_id
    where e.business_id = p_business_id and q.client_id = c.id;
  return jsonb_build_object(
    'profile', coalesce((select jsonb_build_object('recurring', recurring, 'priority', priority)
      from public.client_relationship_profiles where client_id = c.id),
      jsonb_build_object('recurring', false, 'priority', false)),
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

revoke execute on function public.save_relationship_settings(uuid,integer),
  public.save_client_relationship_profile(uuid,uuid,boolean,boolean),
  public.save_service_order_relationship_note(uuid,uuid,integer,text),
  public.get_reconnect_clients(uuid), public.get_client_relationship_overview(uuid,uuid)
  from public, anon;
grant execute on function public.save_relationship_settings(uuid,integer),
  public.save_client_relationship_profile(uuid,uuid,boolean,boolean),
  public.save_service_order_relationship_note(uuid,uuid,integer,text),
  public.get_reconnect_clients(uuid), public.get_client_relationship_overview(uuid,uuid)
  to authenticated;
