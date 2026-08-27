import { useEffect } from 'react';
import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme';
import { useReducedMotion } from './useReducedMotion';

export interface FadeInViewProps extends PropsWithChildren<ViewProps> {
  delay?: number;
  distance?: number;
}

export function FadeInView({
  children,
  delay = 0,
  distance = motion.distance.small,
  style,
  ...props
}: FadeInViewProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    const animation = withTiming(1, {
      duration: reducedMotion ? motion.duration.fast : motion.duration.enter,
    });
    progress.value = reducedMotion ? animation : withDelay(delay, animation);
  }, [delay, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: reducedMotion ? 0 : (1 - progress.value) * distance,
      },
    ],
  }));

  return (
    <Animated.View {...props} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
