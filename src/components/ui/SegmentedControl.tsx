import { ScrollView, StyleSheet, View } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import { radii, sizes, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

/**
 * The selected fill is state-driven and deterministic. Animating colors with
 * one worklet per option caused stale Fabric updates during rapid data-view
 * changes and could leave two options painted as selected. Press feedback
 * remains animated by `AnimatedPressable`; selection itself must never be
 * visually ambiguous.
 */
function SegmentOptionButton<T extends string>({
  option,
  selected,
  disabled,
  scrollable,
  onSelect,
}: {
  option: SegmentOption<T>;
  selected: boolean;
  disabled: boolean;
  scrollable: boolean;
  onSelect: () => void;
}) {
  const { colors } = useTheme();
  const optionStyle = [
    styles.option,
    scrollable && styles.optionScrollable,
    { backgroundColor: selected ? colors.primary : 'transparent' },
  ];
  const content = (
    <Text
      color={selected ? 'textInverse' : 'textSecondary'}
      numberOfLines={1}
      variant="label"
    >
      {option.label}
    </Text>
  );
  const handlePress = () => {
    if (selected) return;
    void triggerHaptic('selection');
    onSelect();
  };

  return (
    <View
      style={
        scrollable ? styles.optionContainerScrollable : styles.optionContainer
      }
    >
      <AnimatedPressable
        accessibilityLabel={option.label}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected, disabled, selected }}
        containerStyle={optionStyle}
        disableScale
        disabled={disabled}
        onPress={handlePress}
      >
        {content}
      </AnimatedPressable>
    </View>
  );
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

  const optionsContent = options.map((option) => (
    <SegmentOptionButton
      key={option.value}
      disabled={disabled}
      onSelect={() => onChange(option.value)}
      option={option}
      scrollable={scrollable}
      selected={option.value === value}
    />
  ));

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
