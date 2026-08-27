import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import type { PropsWithChildren } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme';
import { useReducedMotion } from './useReducedMotion';

export function StepTransition({
  children,
  step,
  direction = 'forward',
}: PropsWithChildren<{
  step: string | number;
  direction?: 'forward' | 'back';
}>) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: reducedMotion ? motion.duration.fast : motion.duration.enter,
    });
  }, [progress, reducedMotion, step]);
  const offset =
    direction === 'forward' ? motion.distance.step : -motion.distance.step;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateX: reducedMotion ? 0 : (1 - progress.value) * offset,
      },
    ],
  }));

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[styles.container, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ container: { width: '100%' } });
