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
    ['brand button', colors.textInverse, colors.primary],
    ['success badge', colors.success, colors.successSurface],
    ['warning badge', colors.warning, colors.warningSurface],
    ['danger badge', colors.danger, colors.dangerSurface],
    ['info badge', colors.info, colors.infoSurface],
  ])('%s meets WCAG AA', (_label, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps surface layers visibly distinct', () => {
    expect(colors.background).not.toBe(colors.surface);
    expect(colors.surface).not.toBe(colors.surfaceElevated);
    expect(colors.surfacePressed).not.toBe(colors.surfaceSelected);
  });

  it('keeps disabled text visually distinct from muted text without claiming AA', () => {
    // Texto desabilitado é intencionalmente isento de WCAG AA (estado inerte,
    // nunca carrega informação essencial sozinho) mas precisa continuar
    // visivelmente diferente do texto secundário/muted para não parecer o
    // mesmo token por acidente.
    expect(colors.textDisabled).not.toBe(colors.textMuted);
    expect(contrast(colors.textDisabled, colors.surface)).toBeLessThan(
      contrast(colors.textMuted, colors.surface),
    );
  });
});

describe('brand and semantic color separation', () => {
  it('keeps the selected Atlantic blue palette as the brand in both themes', () => {
    expect(lightColors.primary).toBe('#24556F');
    expect(darkColors.primary).toBe('#8EC5DE');
  });

  it.each([lightColors, darkColors])(
    'reserves green tokens for positive semantics',
    (colors) => {
      expect(colors.primary).not.toBe(colors.success);
    },
  );
});
