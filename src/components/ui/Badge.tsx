import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radii, spacing, useTheme } from '@/theme';
import type { ColorToken } from '@/theme';
import { Icon } from './Icon';
import { Text } from './Text';

export type BadgeVariant =
  'neutral' | 'success' | 'warning' | 'danger' | 'info';
const labels: Record<BadgeVariant, string> = {
  neutral: 'Status',
  success: 'Sucesso',
  warning: 'Atenção',
  danger: 'Erro',
  info: 'Informação',
};

const indicators = {
  neutral: { icon: 'statusNeutral', color: 'textSecondary' },
  success: { icon: 'success', color: 'success' },
  warning: { icon: 'alert', color: 'warning' },
  danger: { icon: 'statusDanger', color: 'danger' },
  info: { icon: 'statusInfo', color: 'info' },
} as const satisfies Record<
  BadgeVariant,
  { icon: React.ComponentProps<typeof Icon>['name']; color: ColorToken }
>;

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
  const { colors } = useTheme();
  const backgroundColor = {
    neutral: colors.backgroundSubtle,
    success: colors.successSubtle,
    warning: colors.warningSubtle,
    danger: colors.dangerSubtle,
    info: colors.infoSubtle,
  }[variant];
  const indicator = indicators[variant];
  return (
    <View
      accessible
      accessibilityLabel={getBadgeAccessibilityLabel(label, variant)}
      accessibilityRole="text"
      style={[styles.badge, { backgroundColor }]}
    >
      {icon ?? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          testID={`badge-${variant}-indicator`}
        >
          <Icon color={indicator.color} name={indicator.icon} size="small" />
        </View>
      )}
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
});
