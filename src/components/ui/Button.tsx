import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { PressableProps } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { AnimatedPressable } from '@/components/motion';
import { triggerHaptic } from '@/lib/haptics';
import type { HapticIntent } from '@/lib/haptics';
import { radii, sizes, spacing, typography, useTheme } from '@/theme';
import { Text } from './Text';

export type ButtonVariant =
  'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link' | 'icon';
export type ButtonSize = 'small' | 'compact' | 'medium' | 'large';
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

const RADIUS_BY_SIZE: Record<ButtonSize, number> = {
  small: 10,
  compact: 12,
  medium: radii.medium,
  large: 16,
};

const MIN_HEIGHT_BY_SIZE: Record<ButtonSize, number> = {
  small: 44,
  compact: 48,
  medium: sizes.buttonMinHeight,
  large: 56,
};

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
      ? colors.textInverse
      : variant === 'ghost'
        ? colors.textPrimary
        : colors.primary;
  // Ação destrutiva nunca pode depender só da cor vermelha: todo botão
  // `danger` carrega um ícone de alerta por padrão, além do label textual
  // que já descreve a ação (ex.: "Inativar", "Excluir").
  const resolvedIcon =
    icon ??
    (variant === 'danger' && !loading ? (
      <MaterialCommunityIcons
        color={foreground}
        name="alert-outline"
        size={sizes.iconMedium}
        testID="button-danger-icon"
      />
    ) : undefined);
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
        { borderRadius: RADIUS_BY_SIZE[size] },
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && {
          backgroundColor: colors.primaryMuted,
          borderColor: colors.borderSubtle,
          borderRadius: RADIUS_BY_SIZE[size] - 2,
          borderWidth: StyleSheet.hairlineWidth,
        },
        variant === 'outline' && {
          backgroundColor: colors.surfaceInteractive,
          borderColor: colors.borderStrong,
          borderWidth: StyleSheet.hairlineWidth,
          minHeight: MIN_HEIGHT_BY_SIZE[size] - 4,
        },
        variant === 'ghost' && styles.ghost,
        variant === 'link' && styles.link,
        variant === 'icon' && styles.icon,
        variant === 'danger' && { backgroundColor: colors.danger },
        state === 'success' && { backgroundColor: colors.success },
        pressState.pressed && !isDisabled && styles.pressed,
        isDisabled && {
          backgroundColor: colors.surfaceDisabled,
          borderColor: colors.surfaceDisabled,
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
          resolvedIcon
        )}
        <Text style={[styles.label, { color: foreground }]}>{label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
  },
  small: { minHeight: 44, paddingHorizontal: spacing.md },
  compact: { minHeight: 48, paddingHorizontal: spacing[3] },
  medium: { minHeight: sizes.buttonMinHeight },
  large: { minHeight: 56, paddingHorizontal: spacing.lg },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: spacing.sm },
  link: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  icon: {
    backgroundColor: 'transparent',
    minWidth: 48,
    paddingHorizontal: spacing.sm,
  },
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
