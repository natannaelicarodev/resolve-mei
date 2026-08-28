import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { PressableProps } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import type { HapticIntent } from '@/lib/haptics';
import { radii, sizes, spacing, typography, useTheme } from '@/theme';
import { Icon } from './Icon';
import type { IconSize } from './Icon';
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
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const foreground =
    variant === 'primary' || variant === 'danger' || state === 'success'
      ? colors.textOnPrimary
      : variant === 'ghost'
        ? colors.textPrimary
        : colors.primary;
  const defaultIcon =
    variant === 'danger' ? (
      <View testID="button-danger-icon">
        <Icon name="alert" rawColor={foreground} size={dangerIconSize[size]} />
      </View>
    ) : null;
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
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && {
          backgroundColor: colors.surface,
          borderColor: colors.primary,
          borderWidth: 1,
        },
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && { backgroundColor: colors.danger },
        state === 'success' && { backgroundColor: colors.success },
        pressState.pressed && !isDisabled && styles.pressed,
        isDisabled && {
          backgroundColor: colors.disabled,
          borderColor: colors.disabled,
        },
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
          (icon ?? defaultIcon)
        )}
        <Text style={[styles.label, { color: foreground }]}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const dangerIconSize: Record<ButtonSize, IconSize> = {
  small: 'small',
  medium: 'small',
  large: 'medium',
};

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
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.88 },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minWidth: 80,
  },
  label: typography.button,
});
