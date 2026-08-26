import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { triggerHaptic } from '@/lib/haptics';
import { motion } from '@/theme';
import { Text } from '../ui/Text';
import { useReducedMotion } from './useReducedMotion';

export function SuccessTransition({
  message,
  haptic = true,
}: {
  message: string;
  haptic?: boolean;
}) {
  const [progress] = useState(() => new Animated.Value(0));
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (haptic) void triggerHaptic('success');
    const animation = Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      ...(reducedMotion ? { damping: 100, stiffness: 1000 } : motion.spring),
    });
    animation.start();
    return () => animation.stop();
  }, [haptic, progress, reducedMotion]);
  return (
    <Animated.View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.container, { opacity: progress }]}
    >
      <Text color="success" variant="label">
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
});
