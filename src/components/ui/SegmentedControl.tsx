import { ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
  const optionsContent = options.map((option) => {
    const selected = option.value === value;
    return (
      <AnimatedPressable
        accessibilityLabel={option.label}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected, disabled, selected }}
        containerStyle={
          scrollable ? styles.optionContainerScrollable : styles.optionContainer
        }
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
          scrollable && styles.optionScrollable,
          selected && { backgroundColor: colors.primary },
        ]}
      >
        {selected ? (
          <MaterialCommunityIcons
            color={colors.textOnPrimary}
            name="check"
            size={16}
          />
        ) : null}
        <Text
          color={selected ? 'textOnPrimary' : 'textSecondary'}
          numberOfLines={1}
          variant="label"
        >
          {option.label}
        </Text>
      </AnimatedPressable>
    );
  });
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {optionsContent}
    </ScrollView>
  ) : (
    optionsContent
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
