begin;

create or replace function public.get_home_dashboard(
  p_business_id uuid,
  p_period text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_current_month date := date_trunc('month', timezone('America/Fortaleza', now()))::date;
  v_start date;
  v_end date := (v_current_month + interval '1 month')::date;
  v_previous_start date;
  v_start_at timestamptz;
  v_end_at timestamptz;
  v_previous_start_at timestamptz;
  v_month_count integer;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;

  select public.businesses.owner_id into v_owner_id
  from public.businesses where public.businesses.id = p_business_id;
  if v_owner_id is distinct from auth.uid() then raise exception 'BUSINESS_ACCESS_DENIED'; end if;

  case p_period
    when 'month' then v_month_count := 1;
    when '3months' then v_month_count := 3;
    when '6months' then v_month_count := 6;
    when 'year' then v_month_count := extract(month from v_current_month)::integer;
    else raise exception 'INVALID_DASHBOARD_PERIOD';
  end case;

  v_start := (v_current_month - make_interval(months => v_month_count - 1))::date;
  v_previous_start := (v_start - make_interval(months => v_month_count))::date;
  v_start_at := v_start::timestamp at time zone 'America/Fortaleza';
  v_end_at := v_end::timestamp at time zone 'America/Fortaleza';
  v_previous_start_at := v_previous_start::timestamp at time zone 'America/Fortaleza';

  with
  current_quotes as (
    select public.quotes.status, public.quotes.total_cents
    from public.quotes
    where public.quotes.business_id = p_business_id
      and public.quotes.updated_at >= v_start_at and public.quotes.updated_at < v_end_at
  ),
  previous_quotes as (
    select public.quotes.status, public.quotes.total_cents
    from public.quotes
    where public.quotes.business_id = p_business_id
      and public.quotes.updated_at >= v_previous_start_at and public.quotes.updated_at < v_start_at
  ),
  months as (
    select generate_series(v_start, v_current_month, interval '1 month')::date as month_start
  ),
  monthly as (
    select months.month_start,
      coalesce(sum(public.quotes.total_cents) filter (where public.quotes.status = 'approved'), 0)::bigint as approved_cents
    from months
    left join public.quotes
      on public.quotes.business_id = p_business_id
      and public.quotes.updated_at >= (months.month_start::timestamp at time zone 'America/Fortaleza')
      and public.quotes.updated_at < ((months.month_start + interval '1 month')::timestamp at time zone 'America/Fortaleza')
    group by months.month_start order by months.month_start
  ),
  client_counts as (
    select count(*)::integer as total,
      count(*) filter (where public.clients.status = 'active')::integer as active,
      count(*) filter (where public.clients.status = 'inactive')::integer as inactive
    from public.clients where public.clients.business_id = p_business_id
  ),
  service_totals as (
    select public.quote_items.service_id, public.quote_items.name_snapshot as name,
      count(distinct public.quote_items.quote_id)::integer as quote_count,
      sum(public.quote_items.item_total_cents)::bigint as total_cents
    from public.quote_items
    join public.quotes on public.quotes.id = public.quote_items.quote_id
    where public.quotes.business_id = p_business_id
      and public.quotes.issued_on >= v_start and public.quotes.issued_on < v_end
    group by public.quote_items.service_id, public.quote_items.name_snapshot
    order by quote_count desc, total_cents desc, name limit 5
  )
  select jsonb_build_object(
    'business_id', p_business_id, 'period', p_period,
    'period_start', v_start, 'period_end', v_end,
    'approved_cents', coalesce((select sum(total_cents) from current_quotes where status = 'approved'), 0),
    'previous_approved_cents', coalesce((select sum(total_cents) from previous_quotes where status = 'approved'), 0),
    'previous_approved_count', (select count(*)::integer from previous_quotes where status = 'approved'),
    'previous_quote_count', (select count(*)::integer from previous_quotes),
    'negotiating_cents', coalesce((select sum(total_cents) from current_quotes where status = 'sent'), 0),
    'approved_count', (select count(*)::integer from current_quotes where status = 'approved'),
    'open_count', (select count(*)::integer from current_quotes where status in ('draft', 'sent')),
    'quote_count', (select count(*)::integer from current_quotes),
    'monthly', coalesce((select jsonb_agg(jsonb_build_object('month', monthly.month_start, 'approved_cents', monthly.approved_cents) order by monthly.month_start) from monthly), '[]'::jsonb),
    'clients', (select jsonb_build_object('total', client_counts.total, 'active', client_counts.active, 'inactive', client_counts.inactive) from client_counts),
    'services', coalesce((select jsonb_agg(jsonb_build_object('service_id', service_totals.service_id, 'name', service_totals.name, 'quote_count', service_totals.quote_count, 'total_cents', service_totals.total_cents) order by service_totals.quote_count desc, service_totals.total_cents desc, service_totals.name) from service_totals), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.get_home_dashboard(uuid, text) from public;
grant execute on function public.get_home_dashboard(uuid, text) to authenticated;

commit;
