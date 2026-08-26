import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const migration008Path = path.join(
  process.cwd(),
  'supabase/migrations/202608260008_home_dashboard.sql',
);
const migration009Path = path.join(
  process.cwd(),
  'supabase/migrations/202608260009_home_dashboard_quote_count.sql',
);
const sql = fs.readFileSync(migration009Path, 'utf8').toLowerCase();

it('adds migration 009 and locks the inspected migration 008', () => {
  expect(fs.existsSync(migration009Path)).toBe(true);
  const hash = crypto
    .createHash('sha256')
    .update(fs.readFileSync(migration008Path))
    .digest('hex');
  expect(hash).toBe(
    'e1c05728014a3dff38c3e871e27dfaee569eafb97346e00503d9bfb2e4560923',
  );
});

it('replaces the exact JSONB RPC safely without dropping it', () => {
  expect(sql).toMatch(/^begin;/);
  expect(sql).toContain(
    'create or replace function public.get_home_dashboard(\n  p_business_id uuid,\n  p_period text',
  );
  expect(sql).toContain('returns jsonb');
  expect(sql).not.toContain('drop function');
  expect(sql.trim()).toMatch(/commit;$/);
});

it('counts every quote in the selected business and period as an integer', () => {
  const currentQuotes = sql.match(
    /current_quotes as \([\s\S]*?\n  \),\n  previous_quotes/,
  )?.[0];
  expect(currentQuotes).toContain('public.quotes.business_id = p_business_id');
  expect(currentQuotes).toContain('public.quotes.updated_at >= v_start_at');
  expect(currentQuotes).toContain('public.quotes.updated_at < v_end_at');
  expect(currentQuotes).not.toContain('status =');
  expect(sql).toContain(
    "'quote_count', (select count(*)::integer from current_quotes)",
  );
  expect(sql).toContain(
    "'approved_count', (select count(*) from current_quotes where status = 'approved')",
  );
});

it('preserves every field required by the frontend with safe empty aggregates', () => {
  for (const field of [
    'business_id',
    'period',
    'period_start',
    'period_end',
    'approved_cents',
    'previous_approved_cents',
    'negotiating_cents',
    'approved_count',
    'open_count',
    'quote_count',
    'monthly',
    'clients',
    'services',
  ]) {
    expect(sql).toContain(`'${field}'`);
  }
  expect(sql).toContain("'[]'::jsonb");
  expect(sql).toContain('coalesce((select sum(total_cents)');
  expect(sql).toContain('count(*)::integer');
});

it('preserves ownership, periods, search path and least privilege grants', () => {
  expect(sql).toContain('security definer');
  expect(sql).toContain("set search_path = ''");
  expect(sql).toContain('if auth.uid() is null');
  expect(sql).toContain('public.businesses.owner_id');
  expect(sql).toContain('v_owner_id is distinct from auth.uid()');
  for (const period of ['month', '3months', '6months', 'year']) {
    expect(sql).toContain(`when '${period}'`);
  }
  expect(sql).toContain("else raise exception 'invalid_dashboard_period'");
  expect(sql).toContain(
    'revoke all on function public.get_home_dashboard(uuid, text) from public, anon',
  );
  expect(sql).toContain(
    'grant execute on function public.get_home_dashboard(uuid, text) to authenticated',
  );
});
