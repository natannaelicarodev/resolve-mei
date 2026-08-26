import type { PropsWithChildren, ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { FadeInView } from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { radii, spacing, useTheme } from '@/theme';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: PropsWithChildren<{ title: string; subtitle: string; footer?: ReactNode }>) {
  const { colors, resolvedTheme } = useTheme();
  return (
    <Screen contentContainerStyle={styles.screen} keyboardAvoiding>
      <FadeInView style={styles.content}>
        <View style={styles.brand}>
          <Image
            accessibilityLabel="Logotipo do ResolveMEI"
            resizeMode="contain"
            source={
              resolvedTheme === 'light'
                ? require('../../../assets/resolve-mei-mark.png')
                : require('../../../assets/resolve-mei-logo.png')
            }
            style={styles.logo}
          />
          <Text color="primary" variant="cardTitle">
            ResolveMEI
          </Text>
        </View>
        <View style={styles.heading}>
          <Text variant="pageTitle">{title}</Text>
          <Text color="textSecondary">{subtitle}</Text>
        </View>
        <View style={[styles.form, { backgroundColor: colors.surface }]}>
          {children}
        </View>
        {footer}
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', paddingVertical: spacing.xl },
  content: { gap: spacing.lg, width: '100%' },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  logo: { height: 40, width: 40 },
  heading: { gap: spacing.sm },
  form: {
    borderRadius: radii.card,
    gap: spacing.md,
    padding: spacing.lg,
  },
});
