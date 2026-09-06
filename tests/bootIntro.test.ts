import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(path), 'utf8');

describe('Tavi boot introduction', () => {
  it('keeps the approved monoline geometry and measured path lengths together', () => {
    const symbol = source('src/features/boot/TaviMonolineSymbol.tsx');

    expect(symbol).toContain("stroke: '#8EC5DE'");
    expect(symbol).toContain("backgroundColor: '#121A1F'");
    expect(symbol).toContain('length: 430.542');
    expect(symbol).toContain('length: 258.892');
    expect(symbol).toContain('length: 197.533');
    expect(symbol).toContain('length: 203.965');
    expect(symbol).toContain('length: 60');
    expect(symbol).toContain('length: 126.166');
  });

  it('animates SVG props on the UI thread and never introduces a route', () => {
    const symbol = source('src/features/boot/TaviMonolineSymbol.tsx');
    const overlay = source('src/features/boot/BootIntroOverlay.tsx');
    const root = source('app/_layout.tsx');

    expect(symbol).toContain('useAnimatedProps');
    expect(symbol).toContain('strokeDashoffset');
    expect(symbol).toContain('strokeDasharray');
    expect(overlay).toContain('useSharedValue');
    expect(overlay).toContain('withTiming');
    expect(overlay).toContain('duration: BOOT_INTRO_DURATION_MS');
    expect(root).toContain('<BootIntroGate>');
    expect(root).not.toContain('Stack.Screen name="intro"');
  });

  it('waits for reduced-motion preference before hiding the native splash', () => {
    const overlay = source('src/features/boot/BootIntroOverlay.tsx');
    const motion = source('src/components/motion/useReducedMotion.ts');

    expect(motion).toContain('preferenceReady');
    expect(motion).toContain('useReducedMotionPreference');
    expect(overlay).toContain('if (!surfaceReady || !preferenceReady) return');
    expect(overlay).toContain('reducedMotion ? 1 : 0');
    expect(overlay).toContain('SplashScreen.hideAsync()');
  });
});
