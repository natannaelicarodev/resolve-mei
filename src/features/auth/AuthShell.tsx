import type { PropsWithChildren, ReactNode } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FadeInView } from '@/components/motion';
import { Icon, Screen, Text } from '@/components/ui';
import { radii, spacing, useTheme } from '@/theme';

/**
 * Mobile: painel colorido no topo com o formulário num cartão branco que
 * sobe por cima dele (raio grande só no topo, margem negativa) — composição
 * de referência aprovada (dribbble.com/shots/33604959, "Jobsly" no
 * Dribbble). A referência usa gradiente no painel; `TAVI_BRAND_DECISIONS.md`
 * reserva gradiente/brilho ao ícone de loja, então o painel aqui é
 * `colors.primary` sólido. A referência também tem botões de login social —
 * fora do escopo, o app só tem e-mail/senha. Wide (tablet/web) mantém o
 * layout lado a lado que já existia: a referência é pensada para celular, e
 * essa sobreposição não faz sentido numa coluna larga.
 */
export function AuthShell({
  title,
  subtitle,
  topAction,
  heroTitle,
  heroSubtitle,
  children,
  footer,
}: PropsWithChildren<{
  title: string;
  subtitle: string;
  /** Link de navegação no topo do painel, ex.: "Não tem conta? Criar conta". */
  topAction?: ReactNode;
  /** Mensagem de valor exibida somente no painel colorido do layout mobile. */
  heroTitle?: string;
  heroSubtitle?: string;
  footer?: ReactNode;
}>) {
  const { colors, resolvedTheme } = useTheme();
  const wide = useWindowDimensions().width >= 760;

  const brandMark = (
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
  );
  const brand = (
    <View style={styles.brand}>
      {brandMark}
      <Text color="primary" variant="sectionTitle">
        ResolveMEI
      </Text>
    </View>
  );
  // O painel mobile é `colors.primary` (mesma cor do botão de ação
  // principal, para bater com a referência) — texto no tom `primary` do
  // tema ficaria da mesma cor do fundo, então essa variante usa branco.
  const brandOnPrimary = (
    <View style={styles.brand}>
      {brandMark}
      <Text style={{ color: colors.textInverse }} variant="sectionTitle">
        ResolveMEI
      </Text>
    </View>
  );

  if (wide)
    return (
      <Screen
        background="subtle"
        contentWidth="wide"
        contentContainerStyle={styles.screenWide}
        keyboardAvoiding
      >
        <FadeInView style={styles.contentWide}>
          <View
            style={[
              styles.introductionWide,
              { backgroundColor: colors.primaryMuted },
            ]}
          >
            {brand}
            <View style={styles.introductionCopy}>
              <Text variant="display">
                Seu negócio organizado, do seu jeito.
              </Text>
              <Text color="textSecondary">
                Clientes, serviços e orçamentos em uma experiência simples para
                quem faz acontecer.
              </Text>
            </View>
            <View style={styles.benefits}>
              {[
                'Rotina mais clara',
                'Informações no lugar certo',
                'Controle sem burocracia',
              ].map((benefit) => (
                <View key={benefit} style={styles.benefit}>
                  <Icon color="primary" name="success" size="medium" />
                  <Text variant="bodySmall">{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.formColumnWide}>
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

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.mobilePage, { backgroundColor: colors.primary }]}
    >
      <StatusBar style="light" />
      <View
        style={[styles.mobileIntroduction, { backgroundColor: colors.primary }]}
      >
        {topAction ? (
          <View style={styles.topActionRow}>{topAction}</View>
        ) : null}
        {brandOnPrimary}
        {heroTitle ? (
          <View style={styles.mobileHero}>
            <Text style={{ color: colors.textInverse }} variant="display">
              {heroTitle}
            </Text>
            {heroSubtitle ? (
              <Text style={{ color: colors.textInverse }} variant="bodySmall">
                {heroSubtitle}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.mobileKeyboard, { backgroundColor: colors.background }]}
      >
        {/* Raio grande só no topo, com margem negativa para subir por cima
            do painel. O fundo branco vem deste `KeyboardAvoidingView`
            (`flex: 1`, cobre a tela toda), não do `contentContainerStyle` do
            ScrollView — assim o conteúdo cresce só até a altura real do
            formulário, sem deixar um vão vazio depois dele quando é curto. */}
        <ScrollView
          contentContainerStyle={styles.sheet}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeInView style={styles.form}>
            <View style={styles.heading}>
              <Text variant="pageTitle">{title}</Text>
              <Text color="textSecondary">{subtitle}</Text>
            </View>
            {children}
            {footer}
          </FadeInView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Wide (tablet/web): layout lado a lado inalterado.
  screenWide: { justifyContent: 'center', paddingVertical: spacing.xl },
  contentWide: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing[10],
    width: '100%',
  },
  introductionWide: {
    borderRadius: radii.largeCard,
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'space-between',
    minHeight: 520,
    padding: spacing.xl,
  },
  introductionCopy: { gap: spacing.md },
  benefits: { gap: spacing.md },
  benefit: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  formColumnWide: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    maxWidth: 440,
  },
  heading: { gap: spacing.sm },
  form: { gap: spacing.md },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  logo: { height: 40, width: 40 },

  // Mobile: painel colorido, cartão branco sobreposto por cima. O painel só
  // carrega o link de topo e a marca — o título da tela é o H1 do próprio
  // cartão (mesma hierarquia da referência: "Welcome Back" grande dentro do
  // sheet, não pequeno dentro do painel).
  mobilePage: { flex: 1 },
  // `flex: 1` cobre o resto da tela abaixo do painel — o raio e a margem
  // negativa vivem aqui (não no `contentContainerStyle` do ScrollView), para
  // que esse fundo branco preencha até o fim da tela mesmo quando o
  // formulário é curto, sem depender de esticar o conteúdo além do que ele
  // precisa.
  mobileKeyboard: {
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    flex: 1,
    marginTop: -spacing[10],
    position: 'relative',
  },
  topActionRow: { alignItems: 'flex-end', width: '100%' },
  mobileIntroduction: {
    gap: spacing.lg,
    paddingBottom: 64,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  mobileHero: { gap: spacing.sm, maxWidth: 320 },
  sheet: { padding: spacing.lg, paddingBottom: spacing.xl },
});
