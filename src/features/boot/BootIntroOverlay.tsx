import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useReducedMotionPreference } from '@/components/motion';
import { SYMBOL_COLORS, TaviMonolineSymbol } from './TaviMonolineSymbol';

const BOOT_INTRO_DURATION_MS = 1_100;

export function BootIntroOverlay({ onComplete }: { onComplete: () => void }) {
  const { preferenceReady, reducedMotion } = useReducedMotionPreference();
  const [surfaceReady, setSurfaceReady] = useState(false);
  const started = useRef(false);
  const progress = useSharedValue(0);

  const finishWithoutMotion = useCallback(() => {
    requestAnimationFrame(() => requestAnimationFrame(onComplete));
  }, [onComplete]);

  useEffect(() => {
    if (!surfaceReady || !preferenceReady) return;
    if (started.current) return;
    started.current = true;
    progress.value = reducedMotion ? 1 : 0;

    void SplashScreen.hideAsync().then(() => {
      if (reducedMotion) {
        finishWithoutMotion();
        return;
      }

      progress.value = withTiming(
        1,
        { duration: BOOT_INTRO_DURATION_MS },
        (finished) => {
          if (finished) scheduleOnRN(onComplete);
        },
      );
    });
  }, [
    finishWithoutMotion,
    onComplete,
    preferenceReady,
    progress,
    reducedMotion,
    surfaceReady,
  ]);

  return (
    <View
      accessible
      accessibilityLabel="Abrindo Tavi"
      accessibilityRole="image"
      accessibilityViewIsModal
      onLayout={() => setSurfaceReady(true)}
      pointerEvents="none"
      style={styles.overlay}
      testID="boot-intro"
    >
      <TaviMonolineSymbol
        completed={preferenceReady && reducedMotion}
        progress={progress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: SYMBOL_COLORS.backgroundColor,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 100,
  },
});

export { BOOT_INTRO_DURATION_MS };
