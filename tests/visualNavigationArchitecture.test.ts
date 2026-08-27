import fs from 'node:fs';
import path from 'node:path';

import { darkColors, getThemeShadows, lightColors, shadows } from '@/theme';

const source = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), 'utf8');

it('hides the parent and nested technical quotes headers', () => {
  const parent = source('app/(protected)/_layout.tsx');
  const quotes = source('app/(protected)/quotes/_layout.tsx');
  expect(parent).toContain(
    '<Stack.Screen name="quotes" options={{ headerShown: false }} />',
  );
  expect(quotes).toContain('headerShown: false');
});

it('keeps the status bar icon style synchronized with the active theme', () => {
  const root = source('app/_layout.tsx');
  expect(root).toContain("resolvedTheme === 'dark' ? 'light' : 'dark'");
});

it('matches the grouped Clients structure with shared controls', () => {
  const list = source('src/features/quotes/QuoteListScreen.tsx');
  const clients = source('src/features/clients/ClientListScreen.tsx');
  expect(list).toContain('<ListPageHeader');
  expect(list).toContain('title="Orçamentos"');
  expect(clients).toContain('<ListPageHeader');
  expect(clients).toContain('title="Clientes"');
  expect(list).toContain('<SearchInput');
  expect(clients).toContain('<SearchInput');
  expect(list).toContain('<SegmentedControl');
  expect(list).toContain('scrollable');
  expect(list).toContain('<Card style={styles.groupedList}>');
  expect(clients).toContain('<Card style={styles.list}>');
  expect(list).toContain('numberOfLines={1}');
  expect(list).toContain('paddingBottom: 112');
  expect(list).not.toContain('getThemeShadows');
});

it('keeps the shared segmented control integrated and optionally scrollable', () => {
  const segmented = source('src/components/ui/SegmentedControl.tsx');
  expect(segmented).toContain('scrollable?: boolean');
  expect(segmented).toContain('showsHorizontalScrollIndicator={false}');
  expect(segmented).toContain('numberOfLines={1}');
  expect(segmented).toContain('optionContainerScrollable');
});

it('gives both themes distinct layers and dark cards stronger separation', () => {
  expect(lightColors.surface).not.toBe(lightColors.background);
  expect(lightColors.surfaceElevated).not.toBe(lightColors.surface);
  expect(getThemeShadows('light')).toBe(shadows);
  expect(darkColors.surface).not.toBe(darkColors.background);
  expect(darkColors.surfaceElevated).not.toBe(darkColors.surface);
  expect(getThemeShadows('dark').card).not.toEqual(shadows.card);
});

it('keeps the Home period selector compact with a larger hit target', () => {
  const home = source('src/features/home/HomeDashboard.tsx');
  expect(home).toContain('hitSlop={6}');
  expect(home).toContain('minHeight: 36');
  expect(home).toContain("compactLabel: '3 meses'");
  expect(home).toContain("compactLabel: '6 meses'");
});
