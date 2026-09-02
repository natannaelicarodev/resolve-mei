import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202608310014_service_appointments.sql'), 'utf8');

it('creates an owner-isolated appointment history with one active row per order', () => {
  expect(sql).toContain('create table if not exists public.service_appointments');
  expect(sql).toContain("status in ('scheduled', 'completed', 'rescheduled', 'canceled')");
  expect(sql).toContain("where status = 'scheduled'");
  expect(sql).toContain('enable row level security');
  expect(sql).toContain('owner_id = (select auth.uid())');
  expect(sql).not.toMatch(/grant (insert|update|delete) on table public\.service_appointments/i);
});

it('allows only non-terminal orders and today or future dates', () => {
  expect(sql).toContain("v_order.status not in ('pending', 'in_progress', 'paused')");
  expect(sql).toContain("at time zone 'America/Sao_Paulo'");
  expect(sql).toContain('APPOINTMENT_DATE_IN_PAST');
});

it('reschedules atomically without overwriting the original date', () => {
  expect(sql).toContain("set status = 'rescheduled'");
  expect(sql).toContain('rescheduled_from_id');
  expect(sql).toContain("p_scheduled_time, 'scheduled', v_note, v_current.id");
  expect(sql).not.toMatch(/update public\.service_appointments set scheduled_on/i);
});

it('derives overdue and day actions in the same overview RPC', () => {
  expect(sql).toContain('create or replace function public.get_agenda_overview');
  expect(sql).toContain("'overdue', a.scheduled_on < v_today");
  expect(sql).toContain('s.due_on = v_today');
  expect(sql).toContain("a.status = 'scheduled'");
  expect(sql).toContain('q.total_cents - coalesce(x.received, 0) + coalesce(x.refunded, 0) > 0');
});

it('never changes order or quote state from an appointment transition', () => {
  expect(sql).not.toMatch(/update public\.service_orders/i);
  expect(sql).not.toMatch(/update public\.quotes/i);
});
