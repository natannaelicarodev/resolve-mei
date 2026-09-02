import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { AnimatedPressable, useReducedMotion } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import { motion, radii, sizes, spacing, useTheme } from '@/theme';
import { Text } from './Text';
import { Icon } from './Icon';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

/** Where each option sits, measured on layout so the pill can slide to it. */
interface SegmentFrame {
  width: number;
  x: number;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
  scrollable = false,
}: {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  scrollable?: boolean;
}) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  // The selected pill is a single layer behind the options rather than a
  // background on each one, so changing selection slides it instead of
  // repainting two options at once.
  const [frames, setFrames] = useState<Record<string, SegmentFrame>>({});
  const selectedFrame = frames[value];

  const measure = (option: T) => (event: LayoutChangeEvent) => {
    const { width, x } = event.nativeEvent.layout;
    setFrames((current) => {
      const previous = current[option];
      if (previous && previous.width === width && previous.x === x)
        return current;
      return { ...current, [option]: { width, x } };
    });
  };

  const indicatorStyle = useAnimatedStyle(() => {
    if (!selectedFrame) return { opacity: 0 };
    const spring = (target: number) =>
      reducedMotion ? target : withSpring(target, motion.spring.gentle);
    return {
      opacity: 1,
      transform: [{ translateX: spring(selectedFrame.x) }],
      width: spring(selectedFrame.width),
    };
  });

  const optionsContent = options.map((option) => {
    const selected = option.value === value;
    return (
      // The measured wrapper is what the pill follows: `onLayout` on the
      // pressable itself reports a position relative to its own container,
      // which is always zero.
      <View
        key={option.value}
        onLayout={measure(option.value)}
        style={
          scrollable ? styles.optionContainerScrollable : styles.optionContainer
        }
      >
        <AnimatedPressable
          accessibilityLabel={option.label}
          accessibilityRole="radio"
          accessibilityState={{ checked: selected, disabled, selected }}
          disableScale
          disabled={disabled}
          onPress={() => {
            if (selected) return;
            void triggerHaptic('selection');
            onChange(option.value);
          }}
          style={[styles.option, scrollable && styles.optionScrollable]}
        >
          {selected ? (
            <Icon name="success" rawColor={colors.textInverse} size="small" />
          ) : null}
          <Text
            color={selected ? 'textInverse' : 'textSecondary'}
            numberOfLines={1}
            variant="label"
          >
            {option.label}
          </Text>
        </AnimatedPressable>
      </View>
    );
  });

  const indicator = (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.indicator,
        { backgroundColor: colors.primary },
        indicatorStyle,
      ]}
    />
  );

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {indicator}
      {optionsContent}
    </ScrollView>
  ) : (
    <>
      {indicator}
      {optionsContent}
    </>
  );

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="radiogroup"
      style={[styles.group, { backgroundColor: colors.backgroundSubtle }]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  // `left: 0` is the padding box's own origin, which is where a child's
  // measured `x` is relative to — so translateX lands the pill exactly on the
  // option without double-counting the group's padding.
  indicator: {
    borderRadius: radii.small,
    bottom: spacing.xs,
    left: spacing.xs,
    position: 'absolute',
    top: spacing.xs,
  },
  option: {
    alignItems: 'center',
    borderRadius: radii.small,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm,
  },
  optionContainer: { flex: 1, minWidth: 0 },
  optionContainerScrollable: { flexShrink: 0 },
  optionScrollable: { paddingHorizontal: spacing.md },
  scrollContent: { gap: spacing.xs, paddingRight: spacing.xs },
});
