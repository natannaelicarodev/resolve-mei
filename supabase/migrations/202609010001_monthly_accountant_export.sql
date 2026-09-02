create or replace function public.get_expense_month(p_business_id uuid, p_month date)
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
    'financialEntries', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', e.id, 'occurredOn', e.occurred_on, 'quoteNumber', q.quote_number,
      'clientName', q.client_name_snapshot, 'paymentMethod', e.payment_method,
      'type', e.entry_type, 'amountCents', e.amount_cents::text
    ) order by e.occurred_on, e.created_at, e.id), '[]'::jsonb)
    from public.quote_financial_entries e join public.quotes q on q.id = e.quote_id
    where e.business_id = p_business_id and q.business_id = p_business_id
      and e.occurred_on >= v_start and e.occurred_on < v_end),
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

revoke execute on function public.get_expense_month(uuid,date) from public, anon;
grant execute on function public.get_expense_month(uuid,date) to authenticated;
