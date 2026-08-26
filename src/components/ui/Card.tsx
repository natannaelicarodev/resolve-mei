import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PressableProps, ViewProps } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { colors, radii, shadows, spacing } from '@/theme';

export type CardVariant =
  | 'default'
  | 'elevated'
  | 'interactive'
  | 'highlighted'
  | 'success'
  | 'warning'
  | 'danger';
export interface CardProps extends PropsWithChildren<ViewProps> {
  variant?: CardVariant;
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  accessibilityLabel,
  style,
  ...props
}: CardProps) {
  const content = (
    <View style={[styles.card, styles[variant], style]} {...props}>
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.pressable}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: { width: '100%' },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg,
  },
  default: {},
  elevated: { ...shadows.card, borderColor: 'transparent' },
  interactive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderStrong,
  },
  highlighted: {
    backgroundColor: colors.primarySubtle,
    borderColor: colors.primary,
  },
  success: {
    backgroundColor: colors.successSubtle,
    borderColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warningSubtle,
    borderColor: colors.warning,
  },
  danger: { backgroundColor: colors.dangerSubtle, borderColor: colors.danger },
});
