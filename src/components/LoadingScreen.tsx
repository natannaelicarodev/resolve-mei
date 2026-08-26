import { ActivityIndicator, StyleSheet } from 'react-native';

import { FadeInView } from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

export function LoadingScreen({
  label = 'Carregando...',
  description,
}: {
  label?: string;
  description?: string;
}) {
  const { colors } = useTheme();
  return (
    <Screen contentContainerStyle={styles.screen}>
      <FadeInView accessibilityLiveRegion="polite" style={styles.content}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text align="center" variant="cardTitle">
          {label}
        </Text>
        {description ? (
          <Text align="center" color="textSecondary">
            {description}
          </Text>
        ) : null}
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  content: { alignItems: 'center', gap: spacing.sm },
});
