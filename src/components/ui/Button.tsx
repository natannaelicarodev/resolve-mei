import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { PressableProps } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import type { HapticIntent } from '@/lib/haptics';
import { colors, radii, sizes, spacing, typography } from '@/theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'small' | 'medium' | 'large';
export type ButtonState = 'normal' | 'success';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
  icon?: ReactNode;
  haptic?: HapticIntent | false;
}

export function Button({
  label,
  loading = false,
  variant = 'primary',
  size = 'medium',
  state = 'normal',
  icon,
  haptic = false,
  disabled,
  accessibilityLabel = label,
  onPress,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const foreground =
    variant === 'primary' || variant === 'danger' || state === 'success'
      ? colors.textOnPrimary
      : variant === 'ghost'
        ? colors.textPrimary
        : colors.primary;
  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={(event) => {
        if (haptic) void triggerHaptic(haptic);
        onPress?.(event);
      }}
      style={(pressState) => [
        styles.base,
        styles[size],
        styles[variant],
        state === 'success' && styles.success,
        pressState.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(pressState) : style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Carregando"
            color={foreground}
          />
        ) : (
          icon
        )}
        <Text style={[styles.label, { color: foreground }]}>
          {state === 'success' ? `✓ ${label}` : label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radii.medium,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
  },
  small: { minHeight: 44, paddingHorizontal: spacing.md },
  medium: { minHeight: sizes.buttonMinHeight },
  large: { minHeight: 56, paddingHorizontal: spacing.lg },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.danger },
  success: { backgroundColor: colors.success },
  pressed: { opacity: 0.88 },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minWidth: 80,
  },
  label: typography.button,
});
