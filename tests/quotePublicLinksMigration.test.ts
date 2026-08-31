import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/202608310011_quote_public_links.sql',
  ),
  'utf8',
);

describe('quote public link migration security contract', () => {
  it('uses a high-entropy token and stores only its hash', () => {
    expect(migration).toContain('gen_random_bytes(32)');
    expect(migration).toContain("digest(v_token, 'sha256')");
    expect(migration).toContain('token_hash bytea not null unique');
    expect(migration).not.toMatch(/create table[\s\S]*?\btoken\s+text/i);
  });

  it('keeps private tables unavailable to anon and exposes only narrow RPCs', () => {
    for (const table of [
      'quote_public_links',
      'quote_client_decisions',
      'quote_status_events',
      'quote_public_rate_limits',
    ]) {
      expect(migration).toContain(
        `revoke all on table public.${table} from public, anon, authenticated`,
      );
    }
    expect(migration).toContain(
      'grant execute on function public.resolve_public_quote(text) to anon',
    );
    expect(migration).toContain(
      'grant execute on function public.respond_public_quote(text, text, text, text) to anon',
    );
    expect(migration).not.toMatch(
      /grant select on table public\.(quotes|quote_items|businesses).*anon/i,
    );
  });

  it('builds an explicit public snapshot without private fields or notes', () => {
    const snapshot = migration.slice(
      migration.indexOf('v_snapshot := jsonb_build_object('),
      migration.indexOf("if jsonb_array_length(v_snapshot->'items')"),
    );
    expect(snapshot).toContain("'businessName'");
    expect(snapshot).toContain("'quoteNumber'");
    expect(snapshot).toContain("'unitPriceCents'");
    expect(snapshot).not.toMatch(
      /owner_id|document_number|logo_path|pix_key|street|avatar|notes/,
    );
  });

  it('serializes publication and the first final decision', () => {
    expect(migration).toContain('for update of q');
    expect(migration).toContain(
      'select * into v_link from public.quote_public_links where token_hash = v_hash for update',
    );
    expect(migration).toContain(
      'select * into v_quote from public.quotes where id = v_link.quote_id for update',
    );
    expect(migration).toContain('link_id uuid not null unique');
    expect(migration).toContain('v_link.version <> v_quote.shared_version');
  });

  it('enforces expiry, revocation, regeneration and persistent rate limits', () => {
    expect(migration).toContain("clock_timestamp() + interval '7 days'");
    expect(migration).toContain("at time zone 'America/Sao_Paulo'");
    expect(migration).toContain('quote_public_links_one_current_idx');
    expect(migration).toContain('set revoked_at = clock_timestamp()');
    expect(migration).toContain('quote_public_rate_limits');
    expect(migration).toContain("date_bin('5 minutes'");
  });

  it('invalidates pending decisions on edits and manual final status changes', () => {
    expect(migration).toContain('quotes_invalidate_public_link');
    expect(migration).toContain('quote_items_invalidate_public_link');
    expect(migration).toContain('quotes_audit_manual_status');
    expect(migration).toContain('responded_at is null');
    expect(migration).toContain("'manual_status_change'");
  });
});
