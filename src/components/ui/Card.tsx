import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PressableProps, ViewProps } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { getThemeShadows, radii, spacing, useTheme } from '@/theme';
import { Icon } from './Icon';

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
  accessibilityHint?: string;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  ...props
}: CardProps) {
  const { colors, resolvedTheme } = useTheme();
  const variants = {
    default: {},
    elevated: {
      ...getThemeShadows(resolvedTheme).card,
      borderColor: 'transparent',
      borderWidth: 0,
    },
    interactive: {
      alignItems: 'center' as const,
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row' as const,
      // A row in a list is a tappable surface, so it reads as lifted off the
      // page rather than as another outlined block.
      ...getThemeShadows(resolvedTheme).card,
    },
    highlighted: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
      borderStartWidth: spacing.xs,
    },
    success: {
      backgroundColor: colors.successSubtle,
      borderColor: colors.success,
      borderTopWidth: spacing.xs,
    },
    warning: {
      backgroundColor: colors.warningSubtle,
      borderColor: colors.warning,
      borderStyle: 'dashed' as const,
      borderWidth: 1,
    },
    danger: {
      backgroundColor: colors.dangerSubtle,
      borderColor: colors.danger,
      borderWidth: 2,
    },
  };
  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        variants[variant],
        style,
      ]}
      {...props}
    >
      {variant === 'interactive' ? (
        <>
          <View style={styles.interactiveContent}>{children}</View>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            testID="card-interactive-chevron"
          >
            <Icon color="textMuted" name="forward" size="small" />
          </View>
        </>
      ) : (
        children
      )}
    </View>
  );
  if (!onPress) return content;
  return (
    <AnimatedPressable
      accessibilityHint={accessibilityHint}
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
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg,
  },
  interactiveContent: { flex: 1, gap: spacing.md, minWidth: 0 },
});
