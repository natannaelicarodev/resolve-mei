import fs from 'node:fs';
import path from 'node:path';

const sql = fs.readFileSync(
  path.join(
    process.cwd(),
    'supabase/migrations/202608260005_profile_avatars.sql',
  ),
  'utf8',
);

it('defines a private, size-limited avatar bucket and an owned profile path', () => {
  expect(sql).toContain('add column if not exists avatar_path text');
  expect(sql).toContain("'^' || id::text || '/[^/]+$'");
  expect(sql).toMatch(/'avatars',\s*'avatars',\s*false,\s*5242880/);
  expect(sql).toContain("array['image/jpeg', 'image/png', 'image/webp']");
});

it('isolates every storage operation by the authenticated user folder', () => {
  expect(sql.match(/drop policy if exists avatars_/g)).toHaveLength(4);
  expect(
    sql.match(
      /\(storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)\)::text/g,
    ),
  ).toHaveLength(5);
  expect(sql).not.toMatch(/businesses\.logo_path|business-logos/);
});
