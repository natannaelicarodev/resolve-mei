import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { triggerHaptic } from '@/lib/haptics';
import { colors, motion, radii, sizes, spacing } from '@/theme';
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
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: true,
      ...(reducedMotion ? { damping: 100, stiffness: 1000 } : motion.spring),
    }).start();
  }, [haptic, progress, reducedMotion]);
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.icon,
          { opacity: progress, transform: [{ scale: progress }] },
        ]}
      >
        <Text accessibilityElementsHidden style={styles.mark}>
          ✓
        </Text>
      </Animated.View>
      <Text color="success" variant="label">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.sm },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.successSubtle,
    borderRadius: radii.circular,
    height: sizes.avatarMedium,
    justifyContent: 'center',
    width: sizes.avatarMedium,
  },
  mark: { color: colors.success, fontSize: sizes.iconLarge },
});
