import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { radii, spacing, useTheme } from '@/theme';
import { Text } from './Text';

export type FeedbackVariant = 'success' | 'error' | 'warning' | 'info';
const config = {
  success: {
    icon: 'check-circle-outline',
    background: 'successSurface',
    color: 'success',
    label: 'Sucesso',
  },
  error: {
    icon: 'alert-circle-outline',
    background: 'dangerSurface',
    color: 'danger',
    label: 'Erro',
  },
  warning: {
    icon: 'alert-outline',
    background: 'warningSurface',
    color: 'warning',
    label: 'Atenção',
  },
  info: {
    icon: 'information-outline',
    background: 'infoSurface',
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
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.icon}
      >
        <MaterialCommunityIcons
          color={colors[item.color]}
          name={item.icon}
          size={22}
        />
      </View>
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
  icon: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  copy: { flex: 1 },
});
