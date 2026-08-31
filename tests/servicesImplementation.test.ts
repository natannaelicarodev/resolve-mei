import fs from 'node:fs';
import path from 'node:path';

function source(file: string) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

describe('services implementation invariants', () => {
  it('performs server search, deterministic pagination and exact counting', () => {
    const api = source('src/features/services/api.ts');
    expect(api).toContain(".select('*', { count: 'exact' })");
    expect(api).toContain('name.ilike.%${term}%');
    expect(api).toContain('description.ilike.%${term}%');
    expect(api).toContain(".order('created_at', { ascending: true })");
    expect(api).toContain(".order('id', { ascending: true })");
    expect(api).toContain('.limit(SERVICE_PAGE_SIZE + 1)');
    expect(api).not.toContain('.range(');
    expect(api).toContain('created_at.gt.${cursor.createdAt}');
    expect(api).toContain('id.gt.${cursor.id}');
    expect(api).toContain('SERVICE_PAGE_SIZE = 20');
  });

  it('uses infinite queries and stops duplicate page requests', () => {
    const hooks = source('src/features/services/hooks.ts');
    const screen = source('src/features/services/ServiceListScreen.tsx');
    expect(hooks).toContain('useInfiniteQuery');
    expect(hooks).toContain('lastPage.nextCursor ?? undefined');
    expect(screen).toContain('!query.isFetchingNextPage');
    expect(screen).toContain('setTimeout(() => setSearch(input.trim()), 300)');
    expect(screen).toContain('new Map<string, Service>()');
  });

  it('never puts business ownership in editable updates', () => {
    const api = source('src/features/services/api.ts');
    const schemas = source('src/features/services/schemas.ts');
    expect(api).toContain('.update(normalizeServiceInput(input))');
    expect(schemas).not.toContain('business_id');
  });

  it('locks duplicate submissions and clears the navigation timer', () => {
    const form = source('src/features/services/ServiceFormScreen.tsx');
    expect(form).toContain('if (submissionLocked.current) return');
    expect(form).toContain('clearTimeout(navigationTimer.current)');
    expect(form).toContain('mutation.isPending || showSuccess');
  });

  it('keeps creation routes available in the global navigation', () => {
    const navigation = source(
      'src/features/navigation/ProtectedNavigation.tsx',
    );
    expect(navigation).toContain("href: '/services/new'");
    expect(navigation).toContain("href: '/clients/new'");
    expect(navigation).toContain("href: '/quotes/new'");
    expect(navigation).toContain('accessibilityLabel="Criar"');
  });

  it('uses stable responsive cards for the home overview', () => {
    const home = source('src/features/home/HomeDashboard.tsx');
    expect(home).toContain('const wide = width >= 760');
    expect(home).toContain('overviewGridWide');
    expect(home).toMatch(/chartCard: \{[\s\S]*?flex: 2/);
    expect(home).toMatch(/clientsCard: \{[\s\S]*?flex: 1/);
  });
});
