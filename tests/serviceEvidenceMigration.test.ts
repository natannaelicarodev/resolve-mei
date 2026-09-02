import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202608310015_service_evidence.sql'), 'utf8');
const hardeningSql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202608310016_service_evidence_lock_hardening.sql'), 'utf8');

it('creates a private jpeg-only 3 MB evidence bucket', () => {
  expect(sql).toContain("'service-evidence','service-evidence',false,3145728,array['image/jpeg']");
  expect(sql).toContain("lower(storage.extension(name))='jpg'");
});

it('limits each order to 20 pending or active photos', () => {
  expect(sql).toContain("status in ('pending','active'))>=20");
  expect(sql).toContain("raise exception 'EVIDENCE_LIMIT_REACHED'");
});

it('locks active evidence on every completion without unlocking on reopen', () => {
  expect(sql).toContain("if new.event_type='completed'");
  expect(sql).toContain('locked_at is null');
  expect(sql).not.toMatch(/set locked_at=null/i);
});

it('requires an audited reason and an active nonterminal cycle for deletion', () => {
  expect(sql).toContain("o.status not in ('pending','in_progress','paused')");
  expect(sql).toContain("raise exception 'DELETE_REASON_REQUIRED'");
  expect(sql).toContain("'deleted',n,auth.uid()");
});

it('backfills locks and rejects deletion when a later completion exists', () => {
  expect(hardeningSql).toContain("ev.event_type = 'completed'");
  expect(hardeningSql).toContain('ev.created_at >= e.created_at');
  expect(hardeningSql).toContain("raise exception 'EVIDENCE_IMMUTABLE'");
});

it('also locks evidence directly when the order becomes completed', () => {
  expect(hardeningSql).toContain('after update of status on public.service_orders');
  expect(hardeningSql).toContain("new.status = 'completed'");
  expect(hardeningSql).toContain('locked_at is null');
});
