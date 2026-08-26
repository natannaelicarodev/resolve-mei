import fs from 'node:fs';
import path from 'node:path';

const sql = fs
  .readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/202608260008_home_dashboard.sql',
    ),
    'utf8',
  )
  .toLowerCase();

it('creates a private aggregate RPC with explicit ownership validation', () => {
  expect(sql).toContain('security definer');
  expect(sql).toContain("set search_path = ''");
  expect(sql).toContain('public.businesses.owner_id');
  expect(sql).toContain('is distinct from auth.uid()');
  expect(sql).toContain(
    'revoke all on function public.get_home_dashboard(uuid, text) from public, anon',
  );
  expect(sql).toContain(
    'grant execute on function public.get_home_dashboard(uuid, text) to authenticated',
  );
});

it('aggregates real quotes, clients and quote items without payment claims', () => {
  expect(sql).toContain("status = 'approved'");
  expect(sql).toContain("status = 'sent'");
  expect(sql).toContain('from public.clients');
  expect(sql).toContain('from public.quote_items');
  expect(sql).toContain('count(distinct public.quote_items.quote_id)');
  expect(sql).toContain('generate_series');
  expect(sql).toContain("else raise exception 'invalid_dashboard_period'");
  expect(sql).not.toContain('payment');
});
