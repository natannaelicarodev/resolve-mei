import { darkColors, lightColors } from '@/theme';

function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((part) => parseInt(part, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
}

function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
] as const)('%s color contrast', (_, colors) => {
  it.each([
    ['primary text/background', colors.textPrimary, colors.background],
    ['secondary text/background', colors.textSecondary, colors.background],
    ['primary text/surface', colors.textPrimary, colors.surface],
    ['placeholder/surface', colors.textMuted, colors.surface],
    ['brand button', colors.brandOnPrimary, colors.brandPrimary],
    ['positive badge', colors.positive, colors.positiveSoft],
    ['warning badge', colors.warning, colors.warningSoft],
    ['negative badge', colors.negative, colors.negativeSoft],
    ['info badge', colors.info, colors.infoSoft],
  ])('%s meets WCAG AA', (_label, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps surface layers visibly distinct', () => {
    expect(colors.background).not.toBe(colors.surface);
    expect(colors.surface).not.toBe(colors.surfaceElevated);
    expect(colors.surfacePressed).not.toBe(colors.surfaceSelected);
  });
});

describe('brand and semantic color separation', () => {
  it('keeps the selected Atlantic blue palette as the brand in both themes', () => {
    expect(lightColors.brandPrimary).toBe('#24556F');
    expect(darkColors.brandPrimary).toBe('#8EC5DE');
  });

  it.each([lightColors, darkColors])(
    'reserves green tokens for positive semantics',
    (colors) => {
      expect(colors.brandPrimary).not.toBe(colors.positive);
      expect(colors.primary).not.toBe(colors.success);
      expect(colors.positive).toBe(colors.success);
    },
  );
});
