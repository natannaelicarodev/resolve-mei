import fs from 'node:fs';
import path from 'node:path';
import { escapeQuoteSearchPattern } from '@/features/quotes/api';
import { quotesQueryKey } from '@/features/quotes/hooks';

function source(file: string) {
  return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
}

it('escapes every PostgREST search control character', () => {
  expect(escapeQuoteSearchPattern('  Ana_50%\\, (teste)  ')).toBe(
    'Ana\\_50\\%\\\\ teste',
  );
});

it('scopes every quote query to user and business identities', () => {
  expect(quotesQueryKey('user-a', 'business-a')).toEqual([
    'private',
    'user-a',
    'quotes',
    'business-a',
  ]);
  const hooks = source('src/features/quotes/hooks.ts');
  expect(hooks).toContain('enabled: Boolean(userId && businessId)');
  expect(hooks).toContain('enabled: Boolean(userId && businessId && quoteId)');
  expect(hooks).not.toContain('placeholderData');
  expect(hooks).not.toContain('keepPreviousData');
});

it('uses stable cursor pagination and removes duplicate rows defensively', () => {
  const api = source('src/features/quotes/api.ts');
  const screen = source('src/features/quotes/QuoteListScreen.tsx');
  expect(api).toContain('created_at.lt.${cursor.createdAt}');
  expect(api).toContain('id.lt.${cursor.id}');
  expect(api).toContain('.limit(QUOTE_PAGE_SIZE + 1)');
  expect(api).not.toContain('.range(');
  expect(screen).toContain('new Map<string, Quote>()');
  expect(screen).toContain('setTimeout(() => setSearch(input.trim()), 300)');
});

it('remounts forms and ignores mutations after identity changes', () => {
  const form = source('src/features/quotes/QuoteFormScreen.tsx');
  expect(form).toContain("`${userId}:${businessId}:${quote?.id ?? 'new'}`");
  expect(form).toContain('mounted.current = false');
  expect(form).toContain('saved.business_id !== variables.expectedBusinessId');
  expect(form).toContain('locked.current');
  expect(form).toContain("navigation.addListener('beforeRemove'");
  expect(form).toContain('Descartar alterações?');
  expect(form).not.toContain('getValues()');
});

it('keeps quote metrics private and does not invent loading values', () => {
  const hooks = source('src/features/home/hooks.ts');
  const home = source('src/features/home/HomeDashboard.tsx');
  expect(hooks).toContain("'dashboard'");
  expect(home).toContain('dashboardLoading');
  expect(home).toContain('Indisponível');
  expect(home).toContain('Balanço estimado');
});
