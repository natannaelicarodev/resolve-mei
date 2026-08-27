import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PressableProps, ViewProps } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { AnimatedPressable } from '@/components/motion';
import { getThemeShadows, radii, sizes, spacing, useTheme } from '@/theme';
import { Text } from './Text';

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
  /** Título estrutural exibido em um cabeçalho dedicado (usado sobretudo por `summary`). */
  title?: string;
  /** Conteúdo à direita do cabeçalho (ex.: tendência, ação secundária). */
  headerTrailing?: ReactNode;
  /**
   * Conteúdo à direita do card, fora do fluxo vertical do conteúdo. Em
   * `interactive` com `onPress`, um chevron é usado como padrão quando
   * omitido; passe `null` explicitamente para suprimi-lo.
   */
  trailing?: ReactNode;
}

export function Card({
  children,
  variant = 'default',
  onPress,
  accessibilityLabel,
  title,
  headerTrailing,
  trailing,
  style,
  ...props
}: CardProps) {
  const { colors, resolvedTheme } = useTheme();
  const shadows = getThemeShadows(resolvedTheme);
  const paddingByVariant: Partial<Record<CardVariant, number>> = {
    subtle: spacing[4],
    success: spacing[4],
    warning: spacing[4],
    danger: spacing[4],
  };
  const radiusByVariant: Partial<Record<CardVariant, number>> = {
    subtle: radii.medium,
    elevated: radii.largeCard,
  };
  const variants: Record<CardVariant, ViewProps['style']> = {
    default: {},
    subtle: {
      backgroundColor: colors.backgroundSubtle,
      borderColor: 'transparent',
    },
    elevated: {
      ...shadows.elevated,
      backgroundColor: colors.surfaceElevated,
      borderColor: 'transparent',
    },
    interactive: {
      backgroundColor: colors.surfaceInteractive,
      borderColor: colors.borderSubtle,
    },
    selected: {
      backgroundColor: colors.surfaceSelected,
      borderColor: colors.primary,
      paddingLeft: spacing[5] + 4,
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
      backgroundColor: colors.successSurface,
      borderColor: colors.success,
    },
    warning: {
      backgroundColor: colors.warningSurface,
      borderColor: colors.warning,
    },
    danger: {
      backgroundColor: colors.dangerSurface,
      borderColor: colors.danger,
    },
  };
  const resolvedTrailing =
    trailing ??
    (variant === 'interactive' && onPress ? (
      <MaterialCommunityIcons
        color={colors.textMuted}
        name="chevron-right"
        size={sizes.iconMedium}
        testID="card-trailing-chevron"
      />
    ) : null);
  const hasHeader = Boolean(title) || Boolean(headerTrailing);

  const body = resolvedTrailing ? (
    <View style={styles.contentRow}>
      <View style={styles.contentBody}>{children}</View>
      {resolvedTrailing}
    </View>
  ) : (
    children
  );

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
          borderRadius: radiusByVariant[variant] ?? radii.card,
          padding: paddingByVariant[variant] ?? spacing[5],
        },
        variants[variant],
        style,
      ]}
      {...props}
    >
      {variant === 'selected' ? (
        <View
          style={[styles.selectedBar, { backgroundColor: colors.primary }]}
        />
      ) : null}
      {hasHeader ? (
        <View style={styles.header}>
          {title ? (
            <Text style={styles.headerTitle} variant="cardTitle">
              {title}
            </Text>
          ) : null}
          {headerTrailing}
        </View>
      ) : null}
      {body}
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
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    overflow: 'hidden',
  },
  selectedBar: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  headerTitle: { flex: 1, minWidth: 0 },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  contentBody: { flex: 1, gap: spacing.md, minWidth: 0 },
});
