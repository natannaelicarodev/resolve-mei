import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PressableProps, ViewProps } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { getThemeShadows, radii, spacing, useTheme } from '@/theme';

export type CardVariant =
  | 'default'
  | 'subtle'
  | 'elevated'
  | 'interactive'
  | 'selected'
  | 'summary'
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
  const { colors, resolvedTheme } = useTheme();
  const shadows = getThemeShadows(resolvedTheme);
  const variants = {
    default: {},
    subtle: {
      backgroundColor: colors.backgroundSubtle,
      borderColor: 'transparent',
    },
    elevated: { ...shadows.card, borderColor: 'transparent' },
    interactive: {
      backgroundColor: colors.surfaceInteractive,
      borderColor: colors.borderSubtle,
    },
    selected: {
      backgroundColor: colors.surfaceSelected,
      borderColor: colors.primary,
    },
    summary: {
      ...shadows.subtle,
      backgroundColor: colors.surfaceElevated,
      borderColor: 'transparent',
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
    danger: {
      backgroundColor: colors.dangerSubtle,
      borderColor: colors.danger,
    },
  };
  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
        variants[variant],
        style,
      ]}
      {...props}
    >
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
    borderRadius: radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing[5],
  },
});
