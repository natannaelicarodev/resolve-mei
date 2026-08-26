import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import type { PressableProps } from 'react-native';

import { colors, radii, sizes, spacing, typography } from '@/theme';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export function Button({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  accessibilityLabel = label,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        variant === 'secondary' ? styles.secondary : styles.primary,
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Carregando"
            color={
              variant === 'primary' ? colors.textOnPrimary : colors.primary
            }
          />
        ) : null}
        <Text
          style={[
            styles.label,
            variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel,
            isDisabled && styles.disabledLabel,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.controlHeight,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  pressed: { backgroundColor: colors.primaryPressed, opacity: 0.92 },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  content: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  label: typography.label,
  primaryLabel: { color: colors.textOnPrimary },
  secondaryLabel: { color: colors.primary },
  disabledLabel: { color: colors.disabledText },
});
