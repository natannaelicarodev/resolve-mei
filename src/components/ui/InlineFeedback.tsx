import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import { Text } from './Text';

export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info';
const config = {
  success: {
    symbol: '✓',
    background: colors.successSubtle,
    color: colors.success,
    label: 'Sucesso',
  },
  error: {
    symbol: '!',
    background: colors.dangerSubtle,
    color: colors.danger,
    label: 'Erro',
  },
  warning: {
    symbol: '!',
    background: colors.warningSubtle,
    color: colors.warning,
    label: 'Atenção',
  },
  info: {
    symbol: 'i',
    background: colors.infoSubtle,
    color: colors.info,
    label: 'Informação',
  },
} as const;

export function getFeedbackAccessibilityProps(variant: FeedbackVariant) {
  return {
    accessibilityLiveRegion: 'polite' as const,
    accessibilityRole: variant === 'error' ? ('alert' as const) : undefined,
  };
}

export function InlineFeedback({
  message,
  variant,
}: {
  message: string;
  variant: FeedbackVariant;
}) {
  const item = config[variant];
  return (
    <View
      accessible
      {...getFeedbackAccessibilityProps(variant)}
      style={[styles.container, { backgroundColor: item.background }]}
    >
      <Text style={[styles.symbol, { color: item.color }]} variant="label">
        {item.symbol}
      </Text>
      <View style={styles.copy}>
        <Text color="textPrimary" variant="label">
          {item.label}
        </Text>
        <Text variant="bodySecondary">{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    padding: spacing.md,
  },
  symbol: { textAlign: 'center', width: 20 },
  copy: { flex: 1 },
});
