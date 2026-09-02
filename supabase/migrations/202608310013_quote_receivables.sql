create table if not exists public.quote_receivable_settings (
  quote_id uuid primary key references public.quotes(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  due_on date,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_financial_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  service_order_id uuid references public.service_orders(id) on delete restrict,
  original_entry_id uuid references public.quote_financial_entries(id) on delete restrict,
  entry_type text not null check (entry_type in ('receipt', 'refund')),
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  payment_method text not null check (payment_method in (
    'cash', 'pix', 'debit_card', 'credit_card', 'bank_transfer', 'other'
  )),
  note text check (note is null or char_length(note) <= 500),
  actor_user_id uuid not null,
  created_at timestamptz not null default now(),
  check (entry_type <> 'refund' or char_length(note) between 2 and 500),
  check (entry_type = 'refund' or original_entry_id is null)
);

create index if not exists quote_financial_entries_timeline_idx
on public.quote_financial_entries (quote_id, created_at, id);
create index if not exists quote_financial_entries_owner_idx
on public.quote_financial_entries (business_id, occurred_on desc, id desc);

drop trigger if exists quote_receivable_settings_set_updated_at on public.quote_receivable_settings;
create trigger quote_receivable_settings_set_updated_at
before update on public.quote_receivable_settings
for each row execute function public.set_updated_at();

alter table public.quote_receivable_settings enable row level security;
alter table public.quote_financial_entries enable row level security;

drop policy if exists quote_receivable_settings_select_owner on public.quote_receivable_settings;
create policy quote_receivable_settings_select_owner on public.quote_receivable_settings
for select to authenticated using (
  exists (select 1 from public.businesses b
    where b.id = quote_receivable_settings.business_id and b.owner_id = (select auth.uid()))
);
drop policy if exists quote_financial_entries_select_owner on public.quote_financial_entries;
create policy quote_financial_entries_select_owner on public.quote_financial_entries
for select to authenticated using (
  exists (select 1 from public.businesses b
    where b.id = quote_financial_entries.business_id and b.owner_id = (select auth.uid()))
);

revoke all on table public.quote_receivable_settings from public, anon, authenticated;
revoke all on table public.quote_financial_entries from public, anon, authenticated;
grant select on table public.quote_receivable_settings to authenticated;
grant select on table public.quote_financial_entries to authenticated;

create or replace function public.get_quote_receivable(p_business_id uuid, p_quote_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_quote public.quotes; v_due date; v_received bigint; v_refunded bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_quote from public.quotes
    where id = p_quote_id and business_id = p_business_id;
  if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  select due_on into v_due from public.quote_receivable_settings where quote_id = v_quote.id;
  select
    coalesce(sum(amount_cents) filter (where entry_type = 'receipt'), 0),
    coalesce(sum(amount_cents) filter (where entry_type = 'refund'), 0)
  into v_received, v_refunded
  from public.quote_financial_entries where quote_id = v_quote.id;
  return jsonb_build_object(
    'quoteId', v_quote.id,
    'totalCents', v_quote.total_cents::text,
    'receivedCents', v_received::text,
    'refundedCents', v_refunded::text,
    'balanceCents', (v_quote.total_cents - v_received + v_refunded)::text,
    'settled', v_quote.total_cents - v_received + v_refunded = 0,
    'dueOn', v_due,
    'entries', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id, 'type', e.entry_type, 'amountCents', e.amount_cents::text,
      'occurredOn', e.occurred_on, 'paymentMethod', e.payment_method,
      'note', e.note, 'serviceOrderId', e.service_order_id,
      'originalEntryId', e.original_entry_id, 'createdAt', e.created_at
    ) order by e.created_at, e.id), '[]'::jsonb)
    from public.quote_financial_entries e where e.quote_id = v_quote.id)
  );
end;
$$;

create or replace function public.record_quote_financial_entry(
  p_business_id uuid, p_quote_id uuid, p_entry_type text,
  p_amount_cents text, p_occurred_on date, p_payment_method text,
  p_note text default null, p_service_order_id uuid default null,
  p_original_entry_id uuid default null
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_quote public.quotes; v_entry public.quote_financial_entries;
  v_original public.quote_financial_entries; v_amount bigint; v_note text;
  v_received bigint; v_refunded bigint; v_original_refunded bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_quote from public.quotes
    where id = p_quote_id and business_id = p_business_id for update;
  if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  if v_quote.status <> 'approved' then raise exception 'QUOTE_NOT_APPROVED'; end if;
  if p_entry_type not in ('receipt', 'refund') then raise exception 'INVALID_ENTRY_TYPE'; end if;
  if p_amount_cents is null or p_amount_cents !~ '^[1-9][0-9]{0,18}$'
    then raise exception 'INVALID_AMOUNT'; end if;
  begin v_amount := p_amount_cents::bigint;
  exception when numeric_value_out_of_range then raise exception 'INVALID_AMOUNT'; end;
  if p_occurred_on is null or p_occurred_on > (clock_timestamp() at time zone 'America/Sao_Paulo')::date
    then raise exception 'INVALID_OCCURRED_ON'; end if;
  if p_payment_method not in ('cash', 'pix', 'debit_card', 'credit_card', 'bank_transfer', 'other')
    then raise exception 'INVALID_PAYMENT_METHOD'; end if;
  v_note := nullif(btrim(regexp_replace(coalesce(p_note, ''), '\s+', ' ', 'g')), '');
  if v_note is not null and char_length(v_note) > 500 then raise exception 'NOTE_TOO_LONG'; end if;
  if p_entry_type = 'refund' and (v_note is null or char_length(v_note) < 2)
    then raise exception 'REFUND_REASON_REQUIRED'; end if;
  if p_entry_type = 'receipt' and p_original_entry_id is not null
    then raise exception 'ORIGINAL_ONLY_FOR_REFUND'; end if;
  if p_service_order_id is not null and not exists (
    select 1 from public.service_orders o where o.id = p_service_order_id
      and o.quote_id = v_quote.id and o.business_id = v_quote.business_id
  ) then raise exception 'SERVICE_ORDER_NOT_OWNED' using errcode = '42501'; end if;
  select
    coalesce(sum(amount_cents) filter (where entry_type = 'receipt'), 0),
    coalesce(sum(amount_cents) filter (where entry_type = 'refund'), 0)
  into v_received, v_refunded
  from public.quote_financial_entries where quote_id = v_quote.id;
  if p_entry_type = 'receipt' and v_amount > v_quote.total_cents - v_received + v_refunded
    then raise exception 'AMOUNT_EXCEEDS_BALANCE'; end if;
  if p_entry_type = 'refund' and v_amount > v_received - v_refunded
    then raise exception 'REFUND_EXCEEDS_NET_RECEIVED'; end if;
  if p_original_entry_id is not null then
    select * into v_original from public.quote_financial_entries
      where id = p_original_entry_id and quote_id = v_quote.id
        and business_id = v_quote.business_id and entry_type = 'receipt';
    if not found then raise exception 'ORIGINAL_RECEIPT_NOT_FOUND'; end if;
    select coalesce(sum(amount_cents), 0) into v_original_refunded
      from public.quote_financial_entries where original_entry_id = v_original.id;
    if v_original_refunded + v_amount > v_original.amount_cents
      then raise exception 'REFUND_EXCEEDS_ORIGINAL'; end if;
  end if;
  insert into public.quote_financial_entries(
    quote_id, business_id, service_order_id, original_entry_id, entry_type,
    amount_cents, occurred_on, payment_method, note, actor_user_id
  ) values (
    v_quote.id, v_quote.business_id, p_service_order_id, p_original_entry_id,
    p_entry_type, v_amount, p_occurred_on, p_payment_method, v_note, auth.uid()
  ) returning * into v_entry;
  return jsonb_build_object(
    'id', v_entry.id, 'quoteId', v_entry.quote_id, 'type', v_entry.entry_type,
    'amountCents', v_entry.amount_cents::text, 'occurredOn', v_entry.occurred_on,
    'paymentMethod', v_entry.payment_method, 'note', v_entry.note,
    'serviceOrderId', v_entry.service_order_id,
    'originalEntryId', v_entry.original_entry_id, 'createdAt', v_entry.created_at
  );
end;
$$;

create or replace function public.set_quote_receivable_due_on(
  p_business_id uuid, p_quote_id uuid, p_due_on date
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_quote public.quotes; v_setting public.quote_receivable_settings;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into v_quote from public.quotes
    where id = p_quote_id and business_id = p_business_id for update;
  if not found then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  if v_quote.status <> 'approved' then raise exception 'QUOTE_NOT_APPROVED'; end if;
  insert into public.quote_receivable_settings(quote_id, business_id, due_on, created_by)
    values (v_quote.id, v_quote.business_id, p_due_on, auth.uid())
  on conflict (quote_id) do update set due_on = excluded.due_on
  returning * into v_setting;
  return jsonb_build_object('quoteId', v_setting.quote_id, 'dueOn', v_setting.due_on);
end;
$$;

create or replace function public.get_total_receivable(p_business_id uuid)
returns text language plpgsql security definer set search_path = ''
as $$
declare v_total bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select coalesce(sum(q.total_cents - coalesce(x.received, 0) + coalesce(x.refunded, 0)), 0)
  into v_total from public.quotes q left join (
    select quote_id,
      coalesce(sum(amount_cents) filter (where entry_type = 'receipt'), 0) received,
      coalesce(sum(amount_cents) filter (where entry_type = 'refund'), 0) refunded
    from public.quote_financial_entries group by quote_id
  ) x on x.quote_id = q.id
  where q.business_id = p_business_id and q.status = 'approved';
  return v_total::text;
end;
$$;

revoke execute on function public.get_quote_receivable(uuid, uuid) from public, anon;
revoke execute on function public.record_quote_financial_entry(uuid, uuid, text, text, date, text, text, uuid, uuid) from public, anon;
revoke execute on function public.set_quote_receivable_due_on(uuid, uuid, date) from public, anon;
revoke execute on function public.get_total_receivable(uuid) from public, anon;
grant execute on function public.get_quote_receivable(uuid, uuid) to authenticated;
grant execute on function public.record_quote_financial_entry(uuid, uuid, text, text, date, text, text, uuid, uuid) to authenticated;
grant execute on function public.set_quote_receivable_due_on(uuid, uuid, date) to authenticated;
grant execute on function public.get_total_receivable(uuid) to authenticated;
