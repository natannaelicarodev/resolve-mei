import fs from 'node:fs';
import path from 'node:path';
const sql=fs.readFileSync(path.join(process.cwd(),'supabase/migrations/202608310018_client_relationships.sql'),'utf8').toLowerCase();
describe('client relationships migration',()=>{
 it('keeps settings, independent tags and one note per service order in separate tables',()=>{
  expect(sql).toContain('create table public.business_relationship_settings');
  expect(sql).toContain('create table public.client_relationship_profiles');
  expect(sql).toContain('recurring boolean not null');
  expect(sql).toContain('priority boolean not null');
  expect(sql).toContain('service_order_id uuid primary key');
 });
 it('derives reconnect eligibility from completed events and excludes clients without one',()=>{
  expect(sql).toContain("ev.event_type = 'completed'");
  expect(sql).toContain('max(ev.created_at)');
  expect(sql).toContain('from completions x join public.clients');
 });
 it('uses RLS and exposes mutations only through authenticated RPCs',()=>{
  expect(sql).toContain('enable row level security');
  expect(sql).toContain('security definer set search_path =');
  expect(sql).toContain('from public, anon');
  expect(sql).toContain('to authenticated');
 });
});
