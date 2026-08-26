import { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import type { PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';

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
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reducedMotion ? motion.duration.fast : motion.duration.enter,
      delay: reducedMotion ? 0 : delay,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reducedMotion]);
  return (
    <Animated.View
      {...props}
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: reducedMotion
                ? 0
                : progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [distance, 0],
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
