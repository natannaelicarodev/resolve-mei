import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import type { PressableProps } from 'react-native';

import { AnimatedPressable } from '@/components/motion';
import { colors, radii, sizes } from '@/theme';

export interface IconButtonProps extends Omit<PressableProps, 'children'> {
  accessibilityLabel: string;
  icon: ReactNode;
  loading?: boolean;
}

export function IconButton({
  accessibilityLabel,
  icon,
  loading = false,
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <AnimatedPressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={colors.primary} /> : icon}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.circular,
    height: sizes.touchTarget,
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
  pressed: { backgroundColor: colors.surfacePressed },
});
