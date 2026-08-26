import fs from 'node:fs';
import path from 'node:path';

const sql = fs
  .readFileSync(
    path.join(process.cwd(), 'supabase/migrations/202608260004_clients.sql'),
    'utf8',
  )
  .toLowerCase();

describe('clients migration security', () => {
  it('enables RLS and scopes every policy through owned businesses', () => {
    expect(sql).toContain(
      'alter table public.clients enable row level security',
    );
    expect(sql.match(/create policy clients_/g)).toHaveLength(3);
    expect(
      sql.match(/public\.businesses\.owner_id = \(select auth\.uid\(\)\)/g),
    ).toHaveLength(4);
  });

  it('grants authenticated select, insert and update without delete', () => {
    expect(sql).toContain(
      'revoke all privileges on table public.clients from public, anon, authenticated',
    );
    expect(sql).toContain(
      'grant select, insert, update on table public.clients to authenticated',
    );
    expect(sql).not.toMatch(/grant[^;]*delete/);
    expect(sql).not.toContain('create policy clients_delete');
  });

  it('uses partial uniqueness and keeps ownership outside update payloads', () => {
    expect(sql).toContain(
      'unique index if not exists clients_business_document_uidx',
    );
    expect(sql).toContain('where document is not null');
    expect(sql).toContain(
      'references public.businesses(id) on delete restrict',
    );
  });
});
