import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import type { DimensionValue, ViewStyle } from 'react-native';

import { useReducedMotion } from '@/components/motion';
import { colors, opacity, radii } from '@/theme';

export function Skeleton({
  width = '100%',
  height = 16,
  radius = radii.small,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
}) {
  const reducedMotion = useReducedMotion();
  const [value] = useState(() => new Animated.Value(opacity.skeleton));
  useEffect(() => {
    if (reducedMotion) {
      value.setValue(opacity.skeleton);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: opacity.skeleton,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, value]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.base,
        { borderRadius: radius, height, opacity: value, width } as ViewStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.borderStrong },
});
