import fs from 'node:fs';
import path from 'node:path';

import { homeDashboardQueryKey } from '@/features/home/hooks';

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), 'utf8');

it('scopes dashboard cache to user, business and period', () => {
  expect(homeDashboardQueryKey('user-a', 'business-a', '6months')).toEqual([
    'private',
    'user-a',
    'home',
    'business-a',
    'dashboard',
    '6months',
  ]);
  const hooks = read('src/features/home/hooks.ts');
  expect(hooks).toContain('enabled: Boolean(userId && businessId)');
  expect(hooks).not.toContain('placeholderData');
  expect(hooks).not.toContain('keepPreviousData');
});

it('validates the returned identity before exposing private dashboard data', () => {
  const api = read('src/features/home/api.ts');
  const hooks = read('src/features/home/hooks.ts');
  expect(api).toContain(
    'root.business_id !== businessId || root.period !== period',
  );
  expect(hooks).toContain(
    'result.businessId !== businessId || result.period !== period',
  );
});

it('uses responsive native charts without adding a chart dependency', () => {
  const home = read('src/features/home/HomeDashboard.tsx');
  const pkg = read('package.json');
  expect(home).toContain('const compact = width < 600');
  expect(home).toContain('const wide = width >= 760');
  expect(home).toContain('overviewGridWide');
  expect(home).toContain('const chartHeight = singleMonth ? 112');
  expect(home).toContain('barMaximumHeight');
  expect(home).toContain('scrollEnabled={data.monthly.length > 6}');
  expect(home).toContain('minWidth: data.monthly.length * 48');
  expect(pkg).not.toMatch(/victory|chart-kit|gifted-charts/i);
});

it('keeps the compact period selector inside balance and protects mobile spacing', () => {
  const home = read('src/features/home/HomeDashboard.tsx');
  expect(home).toMatch(/function Balance[\s\S]*?<PeriodPicker/);
  expect(home).not.toContain('style={styles.period}');
  expect(home).toContain('numberOfLines={2}');
  expect(home).toContain('adjustsFontSizeToFit');
  expect(home).toContain('metricsCompact');
  // Quick actions are badges on the page background now, so they fit three to
  // a row at any width and no longer need the compact stack the card layout
  // required. HomeDashboardRedesign covers that all three stay reachable.
  expect(home).toContain('styles.quickGrid');
  expect(home).toContain('quickActionBadge');
  expect(home).toContain('paddingBottom: 112');
  expect(home).toContain('const narrow = width <= 359');
  expect(home).toContain('const compact = width < 600');
  expect(home).toContain('const wide = width >= 760');
});

it('contains only the settings access in the header', () => {
  const home = read('src/features/home/HomeDashboard.tsx');
  expect(home.match(/name="cog-outline"/g)).toHaveLength(1);
  expect(home).not.toMatch(/position:\s*'absolute'[\s\S]*cog-outline/);
});
