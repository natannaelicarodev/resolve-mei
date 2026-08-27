import type { PropsWithChildren, ReactNode } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

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
  const wide = useWindowDimensions().width >= 760;
  return (
    <Screen
      background="subtle"
      contentWidth="wide"
      contentContainerStyle={[styles.screen, wide && styles.screenWide]}
      keyboardAvoiding
    >
      <FadeInView style={[styles.content, wide && styles.contentWide]}>
        <View
          style={[
            styles.introduction,
            { backgroundColor: colors.primaryMuted },
            wide && styles.introductionWide,
          ]}
        >
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
            <Text color="primary" variant="sectionTitle">
              ResolveMEI
            </Text>
          </View>
          <View style={styles.introductionCopy}>
            <Text variant={wide ? 'display' : 'cardTitle'}>
              Seu negócio organizado, do seu jeito.
            </Text>
            <Text color="textSecondary">
              Clientes, serviços e orçamentos em uma experiência simples para
              quem faz acontecer.
            </Text>
          </View>
          {wide ? (
            <View style={styles.benefits}>
              {[
                'Rotina mais clara',
                'Informações no lugar certo',
                'Controle sem burocracia',
              ].map((benefit) => (
                <View key={benefit} style={styles.benefit}>
                  <MaterialCommunityIcons
                    color={colors.primary}
                    name="check-circle-outline"
                    size={20}
                  />
                  <Text variant="bodySmall">{benefit}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <View style={[styles.formColumn, wide && styles.formColumnWide]}>
          <View style={styles.heading}>
            <Text variant="pageTitle">{title}</Text>
            <Text color="textSecondary">{subtitle}</Text>
          </View>
          <View style={styles.form}>{children}</View>
          {footer}
        </View>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center', paddingVertical: spacing.lg },
  screenWide: { paddingVertical: spacing.xl },
  content: { gap: spacing.xl, width: '100%' },
  contentWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing[10],
  },
  introduction: {
    borderRadius: radii.largeCard,
    gap: spacing.lg,
    padding: spacing[5],
  },
  introductionWide: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 520,
    padding: spacing.xl,
  },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  logo: { height: 40, width: 40 },
  introductionCopy: { gap: spacing.md },
  benefits: { gap: spacing.md },
  benefit: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  formColumn: { gap: spacing.lg },
  formColumnWide: { flex: 1, justifyContent: 'center', maxWidth: 440 },
  heading: { gap: spacing.sm },
  form: {
    gap: spacing.md,
  },
});
