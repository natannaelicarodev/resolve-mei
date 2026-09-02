import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/202608310013_quote_receivables.sql',
  ),
  'utf8',
);

it('creates an immutable ledger and separate informational due-date settings', () => {
  expect(sql).toContain(
    'create table if not exists public.quote_financial_entries',
  );
  expect(sql).toContain(
    'create table if not exists public.quote_receivable_settings',
  );
  expect(sql).toContain("entry_type in ('receipt', 'refund')");
  expect(sql).not.toMatch(/paid|payment_status|balance_cents\s+bigint/i);
  expect(sql).not.toMatch(/update public\.quotes set/i);
});

it('uses bigint under a locked approved quote and text at the RPC boundary', () => {
  expect(sql).toContain('amount_cents bigint not null');
  expect(sql).toContain('p_amount_cents text');
  expect(sql).toContain('p_amount_cents::bigint');
  expect(sql).toContain('business_id = p_business_id for update');
  expect(sql).toContain("v_quote.status <> 'approved'");
  expect(sql.match(/::text/g)?.length ?? 0).toBeGreaterThanOrEqual(7);
});

it('derives balance and settled from immutable entries', () => {
  expect(sql).toContain("filter (where entry_type = 'receipt')");
  expect(sql).toContain("filter (where entry_type = 'refund')");
  expect(sql).toContain(
    "'balanceCents', (v_quote.total_cents - v_received + v_refunded)::text",
  );
  expect(sql).toContain(
    "'settled', v_quote.total_cents - v_received + v_refunded = 0",
  );
  expect(sql).toContain('AMOUNT_EXCEEDS_BALANCE');
});

it('limits refunds without deleting or editing their original receipts', () => {
  expect(sql).toContain('REFUND_EXCEEDS_NET_RECEIVED');
  expect(sql).toContain('REFUND_EXCEEDS_ORIGINAL');
  expect(sql).toContain(
    'original_entry_id uuid references public.quote_financial_entries',
  );
  expect(sql).not.toMatch(/delete from public\.quote_financial_entries/i);
  expect(sql).not.toMatch(/update public\.quote_financial_entries/i);
});

it('blocks future dates and applies one closed method list to both entry types', () => {
  expect(sql).toContain("clock_timestamp() at time zone 'America/Sao_Paulo'");
  expect(sql).toContain('INVALID_OCCURRED_ON');
  expect(
    sql.match(
      /'cash', 'pix', 'debit_card', 'credit_card', 'bank_transfer', 'other'/g,
    ),
  ).toHaveLength(2);
});

it('isolates both tables and exposes writes only through owner-scoped RPCs', () => {
  expect(sql.match(/enable row level security/g)).toHaveLength(2);
  expect(sql.match(/owner_id = \(select auth\.uid\(\)\)/g)).toHaveLength(2);
  expect(sql).toContain(
    'revoke all on table public.quote_financial_entries from public, anon, authenticated',
  );
  expect(sql).toContain(
    'grant select on table public.quote_financial_entries to authenticated',
  );
  expect(sql).not.toMatch(
    /grant (insert|update|delete) on table public\.quote_financial_entries/i,
  );
});
