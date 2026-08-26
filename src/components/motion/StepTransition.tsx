import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { PropsWithChildren } from 'react';

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
  const [progress] = useState(() => new Animated.Value(0));
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reducedMotion ? motion.duration.fast : motion.duration.enter,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion, step]);
  const offset =
    direction === 'forward' ? motion.distance.step : -motion.distance.step;
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        {
          opacity: progress,
          transform: [
            {
              translateX: reducedMotion
                ? 0
                : progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [offset, 0],
                  }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({ container: { width: '100%' } });
