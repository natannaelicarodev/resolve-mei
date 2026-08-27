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
  expect(list).toContain('<ProtectedPageHeader title="Orçamentos" />');
  expect(clients).toContain('<ProtectedPageHeader title="Clientes" />');
  expect(list).toContain('<Input');
  expect(clients).toContain('<Input');
  expect(list).toContain('<SegmentedControl');
  expect(list).toContain('scrollable');
  expect(list).toContain('<Card style={styles.groupedList}>');
  // Clients renders through FlatList like Quotes and Services, so the rows are
  // no longer wrapped in a Card; the shared controls above them stay the same.
  expect(clients).toContain('<FlatList');
  expect(clients).toContain('ListHeaderComponent={header}');
  expect(clients).not.toContain('clients.map(');
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

it('preserves light tokens while giving dark cards stronger separation', () => {
  expect(lightColors.surface).toBe('#FFFFFF');
  expect(lightColors.border).toBe('#D7DDD8');
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
