import { useEffect, useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Animated, StyleSheet } from 'react-native';

import { triggerHaptic } from '@/lib/haptics';
import { motion, radii, spacing, useTheme } from '@/theme';
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
  const { colors } = useTheme();
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
      <Animated.View
        style={[
          styles.icon,
          { backgroundColor: colors.successSurface },
          {
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: reducedMotion ? [1, 1] : [0.82, 1],
                }),
              },
            ],
          },
        ]}
      >
        <MaterialCommunityIcons
          color={colors.success}
          name="check-bold"
          size={22}
        />
      </Animated.View>
      <Text color="success" variant="label">
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
});
