import fs from 'node:fs';
import path from 'node:path';

const sql = fs
  .readFileSync(
    path.join(process.cwd(), 'supabase/migrations/202608260006_services.sql'),
    'utf8',
  )
  .toLowerCase();

describe('services migration security and modeling', () => {
  it('uses integer cents, positive optional duration and timestamps', () => {
    expect(sql).toContain(
      'price_cents integer not null check (price_cents >= 0)',
    );
    expect(sql).toContain('estimated_duration_minutes > 0');
    expect(sql).toMatch(/created_at timestamptz not null default now\(\)/);
    expect(sql).toMatch(/updated_at timestamptz not null default now\(\)/);
    expect(sql).toContain('execute function public.set_updated_at()');
    expect(sql).not.toMatch(/\b(float|real|double precision)\b/);
  });

  it('keeps names unique per business without case sensitivity', () => {
    expect(sql).toContain(
      'unique index if not exists services_business_name_uidx',
    );
    expect(sql).toContain('on public.services (business_id, lower(name))');
    expect(sql).toContain(
      'references public.businesses(id) on delete restrict',
    );
  });

  it('enables RLS and scopes all policies through the owned business', () => {
    expect(sql).toContain(
      'alter table public.services enable row level security',
    );
    expect(sql.match(/create policy services_/g)).toHaveLength(3);
    expect(
      sql.match(/public\.businesses\.owner_id = \(select auth\.uid\(\)\)/g),
    ).toHaveLength(4);
  });

  it('does not allow delete or ownership updates', () => {
    expect(sql).toContain(
      'revoke all privileges on table public.services from public, anon, authenticated',
    );
    expect(sql).toContain('grant select, insert on table public.services');
    expect(sql).not.toMatch(/grant[^;]*delete/);
    expect(sql).not.toContain('create policy services_delete');
    const updateGrant = sql.match(
      /grant update \([\s\S]*?\) on table public\.services/,
    );
    expect(updateGrant?.[0]).not.toContain('business_id');
  });
});
