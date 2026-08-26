import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewProps } from 'react-native';

import { colors, radii, shadows, spacing } from '@/theme';

export function Card({
  children,
  style,
  ...props
}: PropsWithChildren<ViewProps>) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.lg,
    ...shadows.card,
  },
});
