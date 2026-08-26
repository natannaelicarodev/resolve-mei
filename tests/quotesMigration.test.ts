import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/migrations/202608260007_quotes.sql'),
  'utf8',
);

it('creates quote, item and per-business counter tables with integer money', () => {
  expect(sql).toMatch(/create table if not exists public\.quote_counters/);
  expect(sql).toMatch(/create table if not exists public\.quotes/);
  expect(sql).toMatch(/create table if not exists public\.quote_items/);
  expect(sql).toMatch(/subtotal_cents bigint/);
  expect(sql).toMatch(/unit_price_cents bigint/);
  expect(sql).toMatch(/unique \(business_id, quote_number\)/);
  expect(sql).not.toMatch(/\b(real|double precision|numeric)\b/i);
});

it('uses atomic security-definer operations and a concurrency-safe counter', () => {
  expect(sql).toMatch(/create or replace function public\.save_quote/);
  expect(sql).toMatch(/security definer[\s\S]*?set search_path = ''/);
  expect(sql).toMatch(
    /on conflict \(business_id\) do update[\s\S]*?next_number/,
  );
  expect(sql).toMatch(
    /delete from public\.quote_items where quote_id = v_quote\.id/,
  );
  expect(sql).toMatch(
    /v_subtotal := v_subtotal \+ v_quantity::bigint \* v_unit/,
  );
});

it('enforces ownership, RLS and no direct delete privilege', () => {
  expect(
    sql.match(/owner_id = \(select auth\.uid\(\)\)/g)?.length,
  ).toBeGreaterThanOrEqual(5);
  expect(sql).toMatch(/alter table public\.quotes enable row level security/);
  expect(sql).toMatch(
    /alter table public\.quote_items enable row level security/,
  );
  expect(sql).not.toMatch(/create policy .* for delete/i);
  expect(sql).toMatch(
    /revoke all privileges on table public\.quotes from public, anon, authenticated/,
  );
  expect(sql).toMatch(/grant select on table public\.quotes to authenticated/);
  expect(sql).not.toMatch(/grant delete on table/i);
});

it('validates related records, immutable ownership and status transitions in RPCs', () => {
  expect(sql).toMatch(/CLIENT_NOT_OWNED/);
  expect(sql).toMatch(/SERVICE_NOT_OWNED/);
  expect(sql).toMatch(/QUOTE_NOT_OWNED/);
  expect(sql).toMatch(/QUOTE_NOT_EDITABLE/);
  expect(sql).toMatch(/INVALID_STATUS_TRANSITION/);
  expect(sql).toMatch(/QUOTE_EXPIRED/);
});
