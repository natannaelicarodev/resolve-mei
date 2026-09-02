import fs from 'node:fs';
import path from 'node:path';
const sql=fs.readFileSync(path.join(process.cwd(),'supabase/migrations/202609010001_monthly_accountant_export.sql'),'utf8').toLowerCase();
it('extends the existing monthly RPC with line-by-line financial entries',()=>{
  expect(sql).toContain('create or replace function public.get_expense_month');
  expect(sql).toContain("'financialentries'");
  expect(sql).toContain("'type', e.entry_type");
  expect(sql).toContain("'clientname', q.client_name_snapshot");
  expect(sql).toContain('e.occurred_on >= v_start and e.occurred_on < v_end');
});
it('keeps the owner-only RPC permission contract',()=>{
  expect(sql).toContain("raise exception 'business_not_owned'");
  expect(sql).toContain('revoke execute on function public.get_expense_month(uuid,date) from public, anon');
  expect(sql).toContain('grant execute on function public.get_expense_month(uuid,date) to authenticated');
});
