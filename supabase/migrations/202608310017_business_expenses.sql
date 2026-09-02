create table public.business_expenses (
  id uuid primary key default extensions.gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  quote_id uuid references public.quotes(id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  category text not null check (category in (
    'material', 'transporte', 'ferramentas_equipamentos', 'alimentacao',
    'taxas_impostos', 'marketing', 'outros'
  )),
  description text check (description is null or char_length(description) between 1 and 500),
  recurring boolean not null default false,
  status text not null default 'active' check (status in ('active', 'deleted')),
  created_by uuid not null,
  updated_by uuid not null,
  deleted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (category <> 'outros' or description is not null),
  check ((status = 'deleted') = (deleted_at is not null))
);

create index business_expenses_month_idx
on public.business_expenses (business_id, occurred_on desc, id desc)
where status = 'active';
create index business_expenses_quote_idx
on public.business_expenses (quote_id, occurred_on desc, id desc)
where status = 'active' and quote_id is not null;

create table public.expense_receipts (
  id uuid primary key default extensions.gen_random_uuid(),
  expense_id uuid not null references public.business_expenses(id) on delete restrict,
  business_id uuid not null references public.businesses(id) on delete restrict,
  storage_path text not null unique,
  status text not null check (status in ('pending', 'active', 'deleted')),
  byte_size bigint,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  deleted_by uuid,
  deleted_at timestamptz,
  check (storage_path !~* '^https?://' and storage_path ~ '^[0-9a-f-]+/[0-9a-f-]+/[0-9a-f-]+/[0-9a-f-]+\.jpg$'),
  check ((status = 'deleted') = (deleted_at is not null))
);

create index expense_receipts_expense_idx
on public.expense_receipts (expense_id, created_at, id);

drop trigger if exists business_expenses_set_updated_at on public.business_expenses;
create trigger business_expenses_set_updated_at
before update on public.business_expenses
for each row execute function public.set_updated_at();

alter table public.business_expenses enable row level security;
alter table public.expense_receipts enable row level security;

create policy business_expenses_select_owner on public.business_expenses
for select to authenticated using (exists (
  select 1 from public.businesses b
  where b.id = business_expenses.business_id and b.owner_id = (select auth.uid())
));
create policy expense_receipts_select_owner on public.expense_receipts
for select to authenticated using (exists (
  select 1 from public.businesses b
  where b.id = expense_receipts.business_id and b.owner_id = (select auth.uid())
));

revoke all on public.business_expenses, public.expense_receipts from public, anon, authenticated;
grant select on public.business_expenses, public.expense_receipts to authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('expense-receipts', 'expense-receipts', false, 3145728, array['image/jpeg'])
on conflict(id) do update set public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy expense_receipt_object_select on storage.objects
for select to authenticated using (
  bucket_id = 'expense-receipts' and exists (
    select 1 from public.expense_receipts r
    join public.businesses b on b.id = r.business_id
    where r.storage_path = name and r.status = 'active'
      and b.owner_id = (select auth.uid())
  )
);
create policy expense_receipt_object_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'expense-receipts' and lower(storage.extension(name)) = 'jpg' and exists (
    select 1 from public.expense_receipts r
    join public.businesses b on b.id = r.business_id
    where r.storage_path = name and r.status = 'pending'
      and r.created_by = (select auth.uid()) and b.owner_id = (select auth.uid())
  )
);
create policy expense_receipt_object_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'expense-receipts' and exists (
    select 1 from public.expense_receipts r
    join public.businesses b on b.id = r.business_id
    where r.storage_path = name and r.status in ('pending', 'deleted')
      and b.owner_id = (select auth.uid())
  )
);

create function public.save_business_expense(
  p_business_id uuid, p_amount_cents text, p_occurred_on date,
  p_category text, p_description text default null, p_quote_id uuid default null,
  p_recurring boolean default false, p_expense_id uuid default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare e public.business_expenses; v_amount bigint; v_description text;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  if p_amount_cents is null or p_amount_cents !~ '^[1-9][0-9]{0,18}$'
    then raise exception 'INVALID_EXPENSE_AMOUNT'; end if;
  begin v_amount := p_amount_cents::bigint;
  exception when numeric_value_out_of_range then raise exception 'INVALID_EXPENSE_AMOUNT'; end;
  if p_occurred_on is null or p_occurred_on > (clock_timestamp() at time zone 'America/Sao_Paulo')::date
    then raise exception 'INVALID_EXPENSE_DATE'; end if;
  if p_category not in ('material','transporte','ferramentas_equipamentos','alimentacao','taxas_impostos','marketing','outros')
    then raise exception 'INVALID_EXPENSE_CATEGORY'; end if;
  v_description := nullif(btrim(regexp_replace(coalesce(p_description, ''), '\s+', ' ', 'g')), '');
  if v_description is not null and char_length(v_description) > 500
    then raise exception 'EXPENSE_DESCRIPTION_TOO_LONG'; end if;
  if p_category = 'outros' and v_description is null
    then raise exception 'EXPENSE_DESCRIPTION_REQUIRED'; end if;
  if p_quote_id is not null and not exists (
    select 1 from public.quotes q where q.id = p_quote_id and q.business_id = p_business_id
  ) then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  if p_expense_id is null then
    insert into public.business_expenses(
      business_id, quote_id, amount_cents, occurred_on, category,
      description, recurring, created_by, updated_by
    ) values (
      p_business_id, p_quote_id, v_amount, p_occurred_on, p_category,
      v_description, coalesce(p_recurring, false), auth.uid(), auth.uid()
    ) returning * into e;
  else
    select * into e from public.business_expenses
      where id = p_expense_id and business_id = p_business_id for update;
    if not found then raise exception 'EXPENSE_NOT_OWNED' using errcode = '42501'; end if;
    if e.status <> 'active' then raise exception 'EXPENSE_DELETED'; end if;
    update public.business_expenses set quote_id = p_quote_id, amount_cents = v_amount,
      occurred_on = p_occurred_on, category = p_category, description = v_description,
      recurring = coalesce(p_recurring, false), updated_by = auth.uid()
      where id = e.id returning * into e;
  end if;
  return to_jsonb(e);
end;
$$;

create function public.delete_business_expense(p_business_id uuid, p_expense_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e public.business_expenses; v_paths jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into e from public.business_expenses
    where id = p_expense_id and business_id = p_business_id for update;
  if not found then raise exception 'EXPENSE_NOT_OWNED' using errcode = '42501'; end if;
  if e.status = 'active' then
    update public.business_expenses set status = 'deleted', deleted_at = clock_timestamp(),
      deleted_by = auth.uid(), updated_by = auth.uid() where id = e.id;
    update public.expense_receipts set status = 'deleted', deleted_at = clock_timestamp(),
      deleted_by = auth.uid() where expense_id = e.id and status <> 'deleted';
  end if;
  select coalesce(jsonb_agg(storage_path order by created_at), '[]'::jsonb)
    into v_paths from public.expense_receipts where expense_id = e.id;
  return jsonb_build_object('id', e.id, 'storagePaths', v_paths);
end;
$$;

create function public.get_business_expense(p_business_id uuid, p_expense_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e public.business_expenses;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into e from public.business_expenses where id = p_expense_id
    and business_id = p_business_id and status = 'active';
  if not found then raise exception 'EXPENSE_NOT_OWNED' using errcode = '42501'; end if;
  return jsonb_build_object(
    'id', e.id, 'quoteId', e.quote_id, 'amountCents', e.amount_cents::text,
    'occurredOn', e.occurred_on, 'category', e.category,
    'description', e.description, 'recurring', e.recurring
  );
end;
$$;

create function public.reserve_expense_receipt(p_business_id uuid, p_expense_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare e public.business_expenses; r public.expense_receipts; rid uuid := extensions.gen_random_uuid();
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into e from public.business_expenses
    where id = p_expense_id and business_id = p_business_id for update;
  if not found then raise exception 'EXPENSE_NOT_OWNED' using errcode = '42501'; end if;
  if e.status <> 'active' then raise exception 'EXPENSE_DELETED'; end if;
  if (select count(*) from public.expense_receipts
    where expense_id = e.id and status in ('pending', 'active')) >= 3
    then raise exception 'EXPENSE_RECEIPT_LIMIT_REACHED'; end if;
  insert into public.expense_receipts(id, expense_id, business_id, storage_path, status, created_by)
  values (rid, e.id, e.business_id,
    auth.uid()::text || '/' || e.business_id::text || '/' || e.id::text || '/' || rid::text || '.jpg',
    'pending', auth.uid()) returning * into r;
  return jsonb_build_object('id', r.id, 'storagePath', r.storage_path);
end;
$$;

create function public.finalize_expense_receipt(p_business_id uuid, p_receipt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.expense_receipts; e public.business_expenses; obj storage.objects;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into r from public.expense_receipts
    where id = p_receipt_id and business_id = p_business_id for update;
  if not found or r.created_by <> auth.uid()
    then raise exception 'EXPENSE_RECEIPT_NOT_OWNED' using errcode = '42501'; end if;
  if r.status <> 'pending' then raise exception 'EXPENSE_RECEIPT_STALE'; end if;
  select * into e from public.business_expenses where id = r.expense_id for update;
  if e.status <> 'active' then raise exception 'EXPENSE_DELETED'; end if;
  select * into obj from storage.objects
    where bucket_id = 'expense-receipts' and name = r.storage_path;
  if not found or coalesce((obj.metadata->>'size')::bigint, 0) not between 1 and 3145728
    or obj.metadata->>'mimetype' <> 'image/jpeg'
    then raise exception 'INVALID_EXPENSE_RECEIPT_OBJECT'; end if;
  update public.expense_receipts set status = 'active',
    byte_size = (obj.metadata->>'size')::bigint where id = r.id returning * into r;
  return to_jsonb(r);
end;
$$;

create function public.delete_expense_receipt(p_business_id uuid, p_receipt_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.expense_receipts; e public.business_expenses;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  select * into r from public.expense_receipts
    where id = p_receipt_id and business_id = p_business_id for update;
  if not found then raise exception 'EXPENSE_RECEIPT_NOT_OWNED' using errcode = '42501'; end if;
  select * into e from public.business_expenses where id = r.expense_id for update;
  if e.status <> 'active' then raise exception 'EXPENSE_DELETED'; end if;
  if r.status = 'active' then update public.expense_receipts set status = 'deleted',
    deleted_at = clock_timestamp(), deleted_by = auth.uid()
    where id = r.id returning * into r; end if;
  return jsonb_build_object('storagePath', r.storage_path);
end;
$$;

create function public.cancel_expense_receipt_reservation(p_business_id uuid, p_receipt_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.expense_receipts where id = p_receipt_id
    and business_id = p_business_id and created_by = auth.uid() and status = 'pending';
  if not found then raise exception 'EXPENSE_RECEIPT_RESERVATION_STALE'; end if;
end;
$$;

create function public.get_expense_month(p_business_id uuid, p_month date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_start date; v_end date; v_received bigint; v_expenses bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  if p_month is null then raise exception 'INVALID_RESULT_MONTH'; end if;
  v_start := date_trunc('month', p_month)::date;
  v_end := (v_start + interval '1 month')::date;
  select coalesce(sum(case when entry_type = 'receipt' then amount_cents else -amount_cents end), 0)
    into v_received from public.quote_financial_entries
    where business_id = p_business_id and occurred_on >= v_start and occurred_on < v_end;
  select coalesce(sum(amount_cents), 0) into v_expenses from public.business_expenses
    where business_id = p_business_id and status = 'active'
      and occurred_on >= v_start and occurred_on < v_end;
  return jsonb_build_object(
    'month', v_start, 'receivedCents', v_received::text,
    'expenseCents', v_expenses::text, 'resultCents', (v_received - v_expenses)::text,
    'byCategory', (select coalesce(jsonb_agg(jsonb_build_object(
      'category', grouped.category, 'amountCents', grouped.amount_cents::text
    ) order by grouped.category), '[]'::jsonb) from (
      select category, sum(amount_cents) amount_cents from public.business_expenses
      where business_id = p_business_id and status = 'active'
        and occurred_on >= v_start and occurred_on < v_end group by category
    ) grouped),
    'expenses', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id, 'quoteId', e.quote_id, 'amountCents', e.amount_cents::text,
      'occurredOn', e.occurred_on, 'category', e.category,
      'description', e.description, 'recurring', e.recurring,
      'createdAt', e.created_at, 'updatedAt', e.updated_at,
      'quoteNumber', q.quote_number, 'clientName', q.client_name_snapshot,
      'receiptCount', (select count(*) from public.expense_receipts r
        where r.expense_id = e.id and r.status = 'active')
    ) order by e.occurred_on desc, e.id desc), '[]'::jsonb)
    from public.business_expenses e left join public.quotes q on q.id = e.quote_id
    where e.business_id = p_business_id and e.status = 'active'
      and e.occurred_on >= v_start and e.occurred_on < v_end)
  );
end;
$$;

create function public.get_quote_expense_margin(p_business_id uuid, p_quote_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_received bigint; v_expenses bigint; v_count bigint;
begin
  if auth.uid() is null or not exists (
    select 1 from public.businesses where id = p_business_id and owner_id = auth.uid()
  ) then raise exception 'BUSINESS_NOT_OWNED' using errcode = '42501'; end if;
  if not exists (select 1 from public.quotes where id = p_quote_id and business_id = p_business_id)
    then raise exception 'QUOTE_NOT_OWNED' using errcode = '42501'; end if;
  select coalesce(sum(case when entry_type = 'receipt' then amount_cents else -amount_cents end), 0)
    into v_received from public.quote_financial_entries
    where business_id = p_business_id and quote_id = p_quote_id;
  select coalesce(sum(amount_cents), 0), count(*) into v_expenses, v_count
    from public.business_expenses where business_id = p_business_id
      and quote_id = p_quote_id and status = 'active';
  return jsonb_build_object(
    'quoteId', p_quote_id, 'hasExpenses', v_count > 0,
    'receivedCents', v_received::text, 'expenseCents', v_expenses::text,
    'marginCents', (v_received - v_expenses)::text,
    'expenses', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'amountCents', amount_cents::text, 'occurredOn', occurred_on,
      'category', category, 'description', description
    ) order by occurred_on desc, id desc), '[]'::jsonb)
    from public.business_expenses where business_id = p_business_id
      and quote_id = p_quote_id and status = 'active')
  );
end;
$$;

revoke execute on function public.save_business_expense(uuid,text,date,text,text,uuid,boolean,uuid),
  public.delete_business_expense(uuid,uuid), public.get_business_expense(uuid,uuid), public.reserve_expense_receipt(uuid,uuid),
  public.finalize_expense_receipt(uuid,uuid), public.delete_expense_receipt(uuid,uuid),
  public.cancel_expense_receipt_reservation(uuid,uuid), public.get_expense_month(uuid,date),
  public.get_quote_expense_margin(uuid,uuid) from public, anon;
grant execute on function public.save_business_expense(uuid,text,date,text,text,uuid,boolean,uuid),
  public.delete_business_expense(uuid,uuid), public.get_business_expense(uuid,uuid), public.reserve_expense_receipt(uuid,uuid),
  public.finalize_expense_receipt(uuid,uuid), public.delete_expense_receipt(uuid,uuid),
  public.cancel_expense_receipt_reservation(uuid,uuid), public.get_expense_month(uuid,date),
  public.get_quote_expense_margin(uuid,uuid) to authenticated;
