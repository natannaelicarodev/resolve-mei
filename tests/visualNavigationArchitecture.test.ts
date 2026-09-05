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
  expect(list).toContain('<ProtectedPageHeader');
  expect(list).toContain('title="Orçamentos"');
  // As duas listas usam a faixa de identidade e mantêm os controles animados
  // fora do ListHeaderComponent para evitar remontagem de worklets.
  expect(clients).toContain('<ProtectedPageHeader');
  expect(clients).toContain('title="Clientes"');
  expect(list).toContain('<SearchInput');
  expect(clients).toContain('<SearchInput');
  expect(list).toContain('<SegmentedControl');
  expect(list).toContain('scrollable');
  expect(list).toContain('width: windowWidth + 4');
  expect(list).not.toContain('ListHeaderComponent=');
  // A lista de orçamentos virtualiza por linha: o agrupamento visual vem das
  // bordas/raios da própria linha, não de um Card envolvendo todos os itens.
  expect(list).toContain('data={quotes}');
  expect(list).toContain('keyExtractor={(quote) => quote.id}');
  expect(list).not.toContain('<Card style={styles.groupedList}>');
  expect(clients).toContain('data={clients}');
  expect(clients).toContain('keyExtractor={(client) => client.id}');
  expect(clients).not.toContain('<Card style={styles.list}>');
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

it('uses lateral transitions for list, detail and edit flows', () => {
  for (const layout of [
    'app/(protected)/clients/_layout.tsx',
    'app/(protected)/services/_layout.tsx',
    'app/(protected)/quotes/_layout.tsx',
    'app/(protected)/expenses/_layout.tsx',
    'app/(protected)/service-orders/_layout.tsx',
  ]) {
    expect(source(layout)).toContain("animation: 'slide_from_right'");
  }
  expect(source('app/_layout.tsx')).toContain("animation: 'fade'");
});

it('protects editable production flows from accidental discard', () => {
  for (const screen of [
    'src/features/business/OnboardingScreen.tsx',
    'src/features/clients/ClientFormScreen.tsx',
    'src/features/services/ServiceFormScreen.tsx',
    'src/features/expenses/ExpenseFormScreen.tsx',
    'src/features/profile/ProfileScreen.tsx',
    'src/features/profile/ProfessionalProfileForm.tsx',
  ]) {
    expect(source(screen)).toContain('useUnsavedChangesGuard');
    expect(source(screen)).toContain('<ConfirmationDialog');
  }
  expect(source('src/features/quotes/QuoteFormScreen.tsx')).toContain(
    "navigation.addListener('beforeRemove'",
  );
});
