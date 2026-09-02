import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/202608310017_business_expenses.sql',
  ),
  'utf8',
);

it('creates soft-deleted expenses with the closed category list', () => {
  expect(sql).toContain('create table public.business_expenses');
  for (const category of [
    'material',
    'transporte',
    'ferramentas_equipamentos',
    'alimentacao',
    'taxas_impostos',
    'marketing',
    'outros',
  ])
    expect(sql).toContain(`'${category}'`);
  expect(sql).toContain("status in ('active', 'deleted')");
});

it('keeps receipts private and limited to three compressed jpeg files', () => {
  expect(sql).toContain(
    "'expense-receipts', 'expense-receipts', false, 3145728",
  );
  expect(sql).toContain("lower(storage.extension(name)) = 'jpg'");
  expect(sql).toContain("status in ('pending', 'active')) >= 3");
});

it('calculates monthly net receipts minus active expenses by occurred date', () => {
  expect(sql).toContain(
    "case when entry_type = 'receipt' then amount_cents else -amount_cents end",
  );
  expect(sql).toContain('occurred_on >= v_start and occurred_on < v_end');
  expect(sql).toContain("'resultCents', (v_received - v_expenses)::text");
});

it('calculates lifetime quote margin only from active linked expenses', () => {
  expect(sql).toContain('create function public.get_quote_expense_margin');
  expect(sql).toContain("quote_id = p_quote_id and status = 'active'");
  expect(sql).toContain("'hasExpenses', v_count > 0");
});

it('restricts writes to owner-only security definer RPCs', () => {
  expect(sql).toContain(
    'alter table public.business_expenses enable row level security',
  );
  expect(sql).toContain(
    'revoke all on public.business_expenses, public.expense_receipts from public, anon, authenticated',
  );
  expect(sql).toContain("raise exception 'BUSINESS_NOT_OWNED'");
});
