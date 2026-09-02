import fs from 'node:fs';
import path from 'node:path';

const sql=fs.readFileSync(path.join(process.cwd(),'supabase/migrations/202609010002_client_return_intervals.sql'),'utf8').toLowerCase();

describe('client return intervals migration',()=>{
  it('stores only the approved optional intervals',()=>{
    expect(sql).toContain('add column expected_return_days integer');
    expect(sql).toContain('expected_return_days is null or expected_return_days in (30, 60, 90, 180, 365)');
  });

  it('uses civil dates and includes the client exactly at the effective interval',()=>{
    expect(sql).toContain("clock_timestamp() at time zone 'america/sao_paulo'");
    expect(sql).toContain("last_completed_at at time zone 'america/sao_paulo'");
    expect(sql).toContain('x.days_since >= x.effective_return_days');
    expect(sql).toContain('coalesce(p.expected_return_days, v_days) effective_return_days');
  });

  it('keeps writes owner-scoped and preserves independent profile tags',()=>{
    expect(sql).toContain('create function public.save_client_return_interval');
    expect(sql).toContain('where id = p_business_id and owner_id = auth.uid()');
    expect(sql).toContain("raise exception 'client_not_owned'");
    expect(sql).toContain('set expected_return_days = excluded.expected_return_days');
    expect(sql).not.toContain('set recurring =');
    expect(sql).not.toContain('set priority =');
    expect(sql).toContain('from public, anon');
    expect(sql).toContain('to authenticated');
  });

  it('returns configured and effective interval metadata from both reads',()=>{
    expect(sql.match(/'expectedreturndays'/g)).toHaveLength(4);
    expect(sql.match(/'effectivereturndays'/g)).toHaveLength(3);
    expect(sql.match(/'usesbusinessdefault'/g)).toHaveLength(3);
    expect(sql).toContain('create or replace function public.get_reconnect_clients');
    expect(sql).toContain('create or replace function public.get_client_relationship_overview');
  });
});
