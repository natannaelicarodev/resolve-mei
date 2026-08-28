import fs from 'node:fs';
import path from 'node:path';

import { darkColors, getThemeShadows, lightColors, shadows } from '@/theme';

function channels(hex: string) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) =>
    parseInt(value.slice(index, index + 2), 16),
  ) as [number, number, number];
}

function luminance(hex: string) {
  const [red, green, blue] = channels(hex).map((channel) => {
    const ratio = channel / 255;
    return ratio <= 0.03928
      ? ratio / 12.92
      : Math.pow((ratio + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (first, second) => second - first,
  );
  return (lighter! + 0.05) / (darker! + 0.05);
}

function hue(hex: string) {
  const [red, green, blue] = channels(hex).map((channel) => channel / 255);
  const max = Math.max(red!, green!, blue!);
  const min = Math.min(red!, green!, blue!);
  const delta = max - min;
  if (delta === 0) return 0;
  const degrees =
    max === red!
      ? ((green! - blue!) / delta) % 6
      : max === green!
        ? (blue! - red!) / delta + 2
        : (red! - green!) / delta + 4;
  return (degrees * 60 + 360) % 360;
}

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
  // A list screen names itself once. The large section title carries the name,
  // so the page-header label above it would just repeat the screen name.
  expect(list).not.toContain('<ProtectedPageHeader');
  expect(clients).not.toContain('<ProtectedPageHeader');
  expect(list).toContain('Seus orçamentos');
  expect(clients).toContain('Seus clientes');
  expect(list).toContain('<Input');
  expect(clients).toContain('<Input');
  expect(list).toContain('<SegmentedControl');
  expect(list).toContain('scrollable');
  // All growing collections are real FlatList items. Wrapping the entire
  // collection in one item would silently disable virtualization.
  expect(list).toContain('data={quotes}');
  expect(list).toContain('renderItem={({ item }) => <QuoteRow item={item} />}');
  expect(list).not.toContain('data={quotes.length ? [quotes] : []}');
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
  // The border must read as a divider against the surface it sits on rather
  // than match a specific hex, so the palette can change without silently
  // losing separation.
  expect(contrast(lightColors.border, lightColors.surface)).toBeGreaterThan(
    1.1,
  );
  expect(getThemeShadows('light')).toBe(shadows);
  expect(darkColors.surface).not.toBe(darkColors.background);
  expect(darkColors.surfaceElevated).not.toBe(darkColors.surface);
  expect(getThemeShadows('dark').card).not.toEqual(shadows.card);
});

it('keeps every dark elevation step lighter than the one below it', () => {
  // Elevation in the dark theme is carried by luminance, so the layers must
  // increase monotonically -- a flat or inverted step makes cards unreadable.
  const layers = [
    darkColors.background,
    darkColors.backgroundSubtle,
    darkColors.surface,
    darkColors.surfaceElevated,
    darkColors.surfacePressed,
  ];
  layers.forEach((layer, index) => {
    if (index === 0) return;
    expect(luminance(layer)).toBeGreaterThan(luminance(layers[index - 1]!));
  });
});

it('never uses absolute black as the dark background', () => {
  // Pure black flattens elevation and is an explicit anti-goal of this project.
  expect(darkColors.background.toLowerCase()).not.toBe('#000000');
  expect(luminance(darkColors.background)).toBeGreaterThan(0);
});

it('keeps green semantic and out of the brand role', () => {
  // The brand identity is indigo; green is reserved for success/active states.
  for (const palette of [lightColors, darkColors]) {
    expect(hue(palette.primary)).toBeGreaterThan(230);
    expect(hue(palette.primary)).toBeLessThan(290);
    expect(hue(palette.success)).toBeGreaterThan(90);
    expect(hue(palette.success)).toBeLessThan(180);
  }
});

it('meets WCAG AA on the pairs the interface actually renders', () => {
  const pairs = (palette: typeof lightColors | typeof darkColors) => [
    [palette.textPrimary, palette.background, 4.5],
    [palette.textPrimary, palette.surface, 4.5],
    [palette.textPrimary, palette.surfaceElevated, 4.5],
    [palette.textSecondary, palette.background, 4.5],
    [palette.textSecondary, palette.surface, 4.5],
    [palette.textMuted, palette.surface, 4.5],
    [palette.textOnPrimary, palette.primary, 4.5],
    [palette.textOnDanger, palette.danger, 4.5],
    [palette.primary, palette.surface, 4.5],
    [palette.accent, palette.surface, 4.5],
    [palette.success, palette.successSubtle, 4.5],
    [palette.danger, palette.dangerSubtle, 4.5],
    [palette.disabledText, palette.disabled, 4.5],
    [palette.borderStrong, palette.surface, 3],
    [palette.focusRing, palette.surface, 3],
  ];
  for (const palette of [lightColors, darkColors]) {
    for (const [foreground, background, minimum] of pairs(palette)) {
      expect(
        contrast(foreground as string, background as string),
      ).toBeGreaterThanOrEqual(minimum as number);
    }
  }
});

it('keeps the Home period selector compact with a larger hit target', () => {
  const home = source('src/features/home/HomeDashboard.tsx');
  expect(home).toContain('hitSlop={6}');
  expect(home).toContain('minHeight: 36');
  expect(home).toContain("compactLabel: '3 meses'");
  expect(home).toContain("compactLabel: '6 meses'");
});
