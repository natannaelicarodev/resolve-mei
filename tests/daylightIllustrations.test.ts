import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The illustration layer is addressed by role — a screen asks for `income`,
 * never for a filename — so artwork can be swapped without touching a screen.
 * These checks keep that contract intact, and keep the fallback working while
 * the real artwork is still being produced.
 */
const SOURCE = readFileSync(
  join(__dirname, '..', 'src', 'features', 'daylight', 'Illustration.tsx'),
  'utf8',
);

const SLOT_NAMES = [
  'income',
  'expense',
  'pending',
  'approved',
  'client',
  'service',
  'quote',
  'quoteHero',
  'quoteHeroDraft',
  'catalog',
  'business',
  'stats',
  'empty',
];

describe('illustration registry', () => {
  it('declares a slot for every role the product uses', () => {
    const slots = /const SLOTS: Record<[\s\S]*?^};/m.exec(SOURCE)?.[0] ?? '';
    expect(slots).not.toBe('');
    for (const name of SLOT_NAMES) {
      expect(slots).toContain(`${name}:`);
    }
  });

  it('gives every slot a fallback glyph and tint', () => {
    const slots = /const SLOTS: Record<[\s\S]*?^};/m.exec(SOURCE)?.[0] ?? '';
    // One `icon:` and one `tint:` per slot, so a missing file can never leave
    // an empty circle on screen.
    expect((slots.match(/icon:/g) ?? []).length).toBe(SLOT_NAMES.length);
    expect((slots.match(/tint:/g) ?? []).length).toBe(SLOT_NAMES.length);
  });

  it('keeps artwork optional so a missing file cannot break a screen', () => {
    // `Partial<Record<…>>` is what allows the registry to be filled in one
    // file at a time rather than all at once.
    expect(SOURCE).toMatch(/ARTWORK: Partial<Record<IllustrationName/);
  });

  it('names artwork by role, never by what it depicts', () => {
    // A slot called `banknote` would tie every screen to one drawing; a slot
    // called `income` survives the artwork being redrawn.
    const roleLike = /(banknote|coin|box|piechart|arrow|photo|image\d)/i;
    for (const name of SLOT_NAMES) expect(name).not.toMatch(roleLike);
  });

  it('exports the slot list so screens cannot invent a name', () => {
    expect(SOURCE).toMatch(/export const illustrationNames/);
    expect(SOURCE).toMatch(/export type IllustrationName/);
  });
});

describe('layout clearances', () => {
  const THEME = readFileSync(
    join(__dirname, '..', 'src', 'features', 'daylight', 'theme.ts'),
    'utf8',
  );
  const SIZES = /daySizes = \{([\s\S]*?)\} as const;/.exec(THEME)?.[1] ?? '';
  const sizeOf = (key: string) =>
    Number(new RegExp(`${key}:\\s*(\\d+)`).exec(SIZES)?.[1]);

  const NAV = readFileSync(
    join(
      __dirname,
      '..',
      'src',
      'features',
      'navigation',
      'ProtectedNavigation.tsx',
    ),
    'utf8',
  );

  it('mirrors the real tab bar height', () => {
    // The token is a copy of a value that lives in another file; if the bar
    // grows and this does not, the scroll tail silently stops clearing it.
    const realHeight = Number(
      /bottomNavigation: \{[\s\S]*?minHeight: (\d+)/.exec(NAV)?.[1],
    );
    expect(sizeOf('tabBar')).toBe(realHeight);
  });

  it('uses only a short tail when navigation participates in layout', () => {
    expect(sizeOf('scrollTail')).toBeGreaterThanOrEqual(20);
    expect(sizeOf('scrollTail')).toBeLessThan(sizeOf('tabBar'));
  });

  it('keeps every control at or above the 44px touch target', () => {
    expect(sizeOf('control')).toBeGreaterThanOrEqual(44);
    expect(sizeOf('touchTarget')).toBeGreaterThanOrEqual(44);
  });
});
