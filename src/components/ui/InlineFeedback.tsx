import { StyleSheet, View } from 'react-native';

import { radii, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info';
const config = {
  success: {
    symbol: null,
    background: 'successSubtle',
    color: 'success',
    label: 'Sucesso',
  },
  error: {
    symbol: '!',
    background: 'dangerSubtle',
    color: 'danger',
    label: 'Erro',
  },
  warning: {
    symbol: '!',
    background: 'warningSubtle',
    color: 'warning',
    label: 'Atenção',
  },
  info: {
    symbol: 'i',
    background: 'infoSubtle',
    color: 'info',
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
  const { colors } = useTheme();
  const item = config[variant];
  return (
    <View
      accessible
      {...getFeedbackAccessibilityProps(variant)}
      style={[styles.container, { backgroundColor: colors[item.background] }]}
    >
      {item.symbol ? (
        <Text
          style={[styles.symbol, { color: colors[item.color] }]}
          variant="label"
        >
          {item.symbol}
        </Text>
      ) : null}
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
