import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { triggerHaptic } from '@/lib/haptics';
import { motion, radii, spacing, useTheme } from '@/theme';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { useReducedMotion } from './useReducedMotion';

export function SuccessTransition({
  message,
  haptic = true,
}: {
  message: string;
  haptic?: boolean;
}) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const { colors } = useTheme();
  useEffect(() => {
    if (haptic) void triggerHaptic('success');
    progress.value = withSpring(
      1,
      reducedMotion ? { damping: 100, stiffness: 1000 } : motion.spring.press,
    );
  }, [haptic, progress, reducedMotion]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: reducedMotion ? 1 : 0.82 + progress.value * 0.18,
      },
    ],
  }));

  return (
    <Animated.View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.container, containerStyle]}
    >
      <Animated.View
        style={[
          styles.icon,
          { backgroundColor: colors.successSurface },
          iconStyle,
        ]}
      >
        <Icon name="success" rawColor={colors.success} size="medium" />
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
