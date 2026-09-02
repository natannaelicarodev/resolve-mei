import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/202608310012_service_orders.sql',
  ),
  'utf8',
);

it('models an implicit not-started state and permits replacement only after cancellation', () => {
  expect(sql).toContain(
    "status in ('pending', 'in_progress', 'paused', 'completed', 'canceled')",
  );
  expect(sql).toContain("where status <> 'canceled'");
  expect(sql).toContain("if v_quote.status <> 'approved'");
  expect(sql).toContain(
    "values (v_quote.id, v_quote.business_id, v_quote.client_id, 'pending', null)",
  );
});

it('enforces the transition graph and stale-write protection in the backend', () => {
  expect(sql).toContain('if v_order.status <> p_expected_status');
  expect(sql).toContain(
    "v_order.status = 'in_progress' and p_status in ('paused', 'completed', 'canceled')",
  );
  expect(sql).toContain(
    "v_order.status = 'paused' and p_status in ('in_progress', 'completed', 'canceled')",
  );
  expect(sql).toContain(
    "v_order.status = 'pending' and p_status in ('in_progress', 'canceled')",
  );
  expect(sql).toContain(
    "v_order.status = 'completed' and p_status = 'in_progress'",
  );
  expect(sql).toContain('CANCEL_REASON_REQUIRED');
  expect(sql).toContain('REOPEN_REASON_REQUIRED');
  expect(sql).toContain('char_length(v_reason) not between 2 and 500');
});

it('keeps events immutable to app roles and attributes writes to the owner', () => {
  expect(sql).toContain(
    'revoke all on table public.service_order_events from public, anon, authenticated',
  );
  expect(sql).toContain(
    'grant select on table public.service_order_events to authenticated',
  );
  expect(sql).not.toMatch(
    /grant (insert|update|delete) on table public\.service_order_events/i,
  );
  expect(sql.match(/actor_user_id/g)?.length ?? 0).toBeGreaterThanOrEqual(4);
  expect(sql.match(/auth\.uid\(\)/g)?.length ?? 0).toBeGreaterThanOrEqual(7);
});

it('isolates tables and RPCs by the authenticated business owner', () => {
  expect(sql.match(/enable row level security/g)).toHaveLength(2);
  expect(
    sql.match(/owner_id = \(select auth\.uid\(\)\)/g)?.length,
  ).toBeGreaterThanOrEqual(2);
  expect(sql.match(/owner_id = auth\.uid\(\)/g)?.length).toBeGreaterThanOrEqual(
    3,
  );
  expect(sql).toContain(
    "raise exception 'SERVICE_ORDER_NOT_OWNED' using errcode = '42501'",
  );
  expect(sql).toContain(
    'revoke execute on function public.create_service_order(uuid, uuid) from public, anon',
  );
});

it('supports text notes without adding an execution image pipeline', () => {
  expect(sql).toContain(
    "event_type in ('created', 'started', 'paused', 'resumed', 'completed', 'reopened', 'canceled', 'note')",
  );
  expect(sql).toContain('char_length(note) between 1 and 2000');
  expect(sql).not.toMatch(/storage\.|bucket|image|attachment/i);
});
