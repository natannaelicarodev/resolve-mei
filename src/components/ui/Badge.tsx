import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import { Text } from './Text';

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
const labels: Record<BadgeVariant, string> = {
  neutral: 'Status',
  success: 'Sucesso',
  warning: 'Atenção',
  danger: 'Erro',
  info: 'Informação',
};

export function getBadgeAccessibilityLabel(
  label: string,
  variant: BadgeVariant,
): string {
  return `${labels[variant]}: ${label}`;
}

export function Badge({
  label,
  variant = 'neutral',
  icon,
}: {
  label: string;
  variant?: BadgeVariant;
  icon?: ReactNode;
}) {
  return (
    <View
      accessible
      accessibilityLabel={getBadgeAccessibilityLabel(label, variant)}
      accessibilityRole="text"
      style={[styles.badge, styles[variant]]}
    >
      {icon}
      <Text variant="status">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
  },
  neutral: { backgroundColor: colors.backgroundSubtle },
  success: { backgroundColor: colors.successSubtle },
  warning: { backgroundColor: colors.warningSubtle },
  danger: { backgroundColor: colors.dangerSubtle },
  info: { backgroundColor: colors.infoSubtle },
});
