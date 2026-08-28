import { StyleSheet, View } from 'react-native';

import { Button, Icon, Screen, Text } from '@/components/ui';
import { radii, spacing, useTheme } from '@/theme';

export interface ErrorFallbackProps {
  onRetry?: () => void;
}

// TODO(a11y): this screen never exposes accessibilityRole="alert" /
// accessibilityLiveRegion, so screen readers don't announce it when it
// replaces a broken screen. Found while auditing the Clientes redesign
// (2026-08-28); left unfixed there since this component is unrelated to
// that work. Add the role/live-region to the `copy` View below (see
// tests/AppErrorBoundary.test.tsx, which already expects getByRole('alert')
// to find something here).
export function ErrorFallback({ onRetry }: ErrorFallbackProps) {
  const { colors } = useTheme();
  return (
    <Screen
      contentContainerStyle={styles.screen}
      safeAreaEdges={['top', 'bottom']}
    >
      <View style={[styles.icon, { backgroundColor: colors.dangerSubtle }]}>
        <Icon color="danger" name="alert" size="large" />
      </View>
      <View style={styles.copy}>
        <Text align="center" variant="sectionTitle">
          Algo deu errado
        </Text>
        <Text align="center" color="textSecondary">
          Não foi possível exibir esta tela com segurança.
        </Text>
      </View>
      {onRetry ? <Button label="Tentar novamente" onPress={onRetry} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', paddingHorizontal: spacing.lg },
  icon: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radii.medium,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  copy: { gap: spacing.sm },
});
