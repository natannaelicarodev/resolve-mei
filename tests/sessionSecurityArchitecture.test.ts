import fs from 'node:fs';
import path from 'node:path';

function source(file: string) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

it('keeps avatar URLs and the protected tree bound to the current user', () => {
  const home = source('app/(protected)/home.tsx');
  const profile = source('src/features/profile/ProfileScreen.tsx');
  const layout = source('app/(protected)/_layout.tsx');
  expect(home).toContain("'private',\n      userId,\n      'profile-avatar'");
  expect(profile).toContain(
    "'private',\n      userId,\n      'profile-avatar'",
  );
  expect(layout).toContain('key={user?.id}');
  expect(profile).toContain('query.data?.id === userId');
});

it('cancels and clears cache before publishing another identity', () => {
  const auth = source('src/providers/AuthProvider.tsx');
  expect(auth).toMatch(
    /setSession\(null\);[\s\S]*?await queryClient\.cancelQueries\(\);[\s\S]*?queryClient\.clear\(\);/,
  );
  expect(auth).toContain('currentUserId.current === nextUserId');
  expect(auth).toContain('!authEventReceived');
});

it('does not persist private query or signed URL data', () => {
  const providers = source('src/providers/AppProviders.tsx');
  const theme = source('src/theme/ThemeProvider.tsx');
  expect(providers).not.toContain('PersistQueryClientProvider');
  expect(providers).not.toContain('persistQueryClient');
  expect(theme).toContain(
    "const STORAGE_KEY = '@resolve-mei/theme-preference-v2'",
  );
});
