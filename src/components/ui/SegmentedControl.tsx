import { StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import { radii, sizes, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="radiogroup"
      style={[styles.group, { backgroundColor: colors.backgroundSubtle }]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <AnimatedPressable
            accessibilityLabel={option.label}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled, selected }}
            containerStyle={styles.optionContainer}
            disableScale
            disabled={disabled}
            key={option.value}
            onPress={() => {
              if (selected) return;
              void triggerHaptic('selection');
              onChange(option.value);
            }}
            style={[
              styles.option,
              selected && { backgroundColor: colors.primary },
            ]}
          >
            <Text
              color={selected ? 'textOnPrimary' : 'textSecondary'}
              variant="label"
            >
              {option.label}
            </Text>
          </AnimatedPressable>
        );
      })}
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
  option: {
    alignItems: 'center',
    borderRadius: radii.small,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm,
  },
  optionContainer: { flex: 1, minWidth: 0 },
});
