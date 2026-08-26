import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: PropsWithChildren<{ title: string; subtitle: string; footer?: ReactNode }>) {
  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.brand}>
        <Text variant="title">ResolveMEI</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Card>
        <Text variant="title">{title}</Text>
        {children}
      </Card>
      {footer}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  brand: { gap: spacing.xs },
  subtitle: { color: colors.textMuted },
});
