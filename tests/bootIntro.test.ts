import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(path), 'utf8');

describe('Tavi boot introduction', () => {
  it('draws the outlined wordmark before filling it with the app primary', () => {
    const symbol = source('src/features/boot/TaviWordmark.tsx');

    expect(symbol).toContain("backgroundColor: '#F7F5F2'");
    expect(symbol).toContain("ink: '#24556F'");
    expect(symbol).toContain("assets/images/tavi-wordmark.png");
    expect(symbol).toContain("assets/images/tavi-wordmark-outline.png");
    expect(symbol).toContain('outlineRevealStyle = useAnimatedStyle');
    expect(symbol).toContain('fillRevealStyle = useAnimatedStyle');
    expect(symbol).toContain('[0, 0.55]');
    expect(symbol).toContain('[0.35, 1]');
    expect(symbol).not.toContain('SvgText');
    expect(symbol).not.toContain('fontFamily');
  });

  it('animates SVG props on the UI thread and never introduces a route', () => {
    const symbol = source('src/features/boot/TaviWordmark.tsx');
    const overlay = source('src/features/boot/BootIntroOverlay.tsx');
    const root = source('app/_layout.tsx');

    expect(symbol).toContain('useAnimatedStyle');
    expect(symbol).toContain("overflow: 'hidden'");
    expect(overlay).toContain('useSharedValue');
    expect(overlay).toContain('withTiming');
    expect(overlay).toContain('duration: BOOT_INTRO_DURATION_MS');
    expect(root).toContain('<BootIntroGate>');
    expect(root).not.toContain('Stack.Screen name="intro"');
  });

  it('keeps the intro above loading screens until Login or Home is ready', () => {
    const gate = source('src/features/boot/BootIntroGate.tsx');
    const authLayout = source('app/(auth)/_layout.tsx');
    const protectedLayout = source('app/(protected)/_layout.tsx');

    expect(gate).toContain('!animationComplete || !destinationReady');
    expect(gate).toContain('requestAnimationFrame(() =>');
    expect(authLayout).toContain('markDestinationReady()');
    expect(protectedLayout).toContain("decision !== 'loading'");
  });

  it('waits for reduced-motion preference before hiding the native splash', () => {
    const overlay = source('src/features/boot/BootIntroOverlay.tsx');
    const motion = source('src/components/motion/useReducedMotion.ts');
    const root = source('app/_layout.tsx');

    expect(motion).toContain('preferenceReady');
    expect(motion).toContain('useReducedMotionPreference');
    expect(overlay).toContain('if (!surfaceReady || !preferenceReady) return');
    expect(overlay).toContain('reducedMotion ? 1 : 0');
    expect(overlay).toContain('SplashScreen.hideAsync()');
    expect(root).toContain('SplashScreen.setOptions({ fade: false })');
  });

  it('keeps the mandatory native launch screen visually continuous', () => {
    const config = source('app.json');
    const transparentDrawable = source(
      'assets/images/splash-transparent.xml',
    );

    expect(config).toContain('"backgroundColor": "#F7F5F2"');
    expect(config).toContain('"icon": "./assets/images/splash-transparent.xml"');
    expect(config).not.toContain('"image": "./assets/images/splash.png"');
    expect(transparentDrawable).toContain('@android:color/transparent');
  });
});
