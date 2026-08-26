import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

export function LoadingScreen({ label = 'Carregando...' }: { label?: string }) {
  return (
    <Screen contentContainerStyle={styles.screen}>
      <View accessibilityLiveRegion="polite" style={styles.content}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text>{label}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  content: { alignItems: 'center', gap: spacing.md },
});
