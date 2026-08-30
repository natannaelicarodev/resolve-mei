import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Check, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import {
  AnimatedPressable,
  FadeInView,
  useReducedMotion,
} from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { WelcomeAmbientBackground } from '@/features/auth/WelcomeScreen';
import { triggerHaptic } from '@/lib/haptics';

const palette = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceRaised: '#121212',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  primary: '#45E6B0',
  primarySoft: 'rgba(69,230,176,0.12)',
  text: '#FFFFFF',
  textSecondary: '#A1A1A7',
  textMuted: '#717178',
} as const;

export function maskEmail(value: string | undefined): string | null {
  if (!value) return null;
  const [local, domain] = value.split('@');
  if (!local || !domain) return null;
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(2, Math.min(6, local.length - 2)))}@${domain}`;
}

function DeliveredMark() {
  const reducedMotion = useReducedMotion();
  const [arrival] = useState(() => new Animated.Value(0));
  const [confirmation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const enter = Animated.spring(arrival, {
      damping: reducedMotion ? 100 : 17,
      mass: 0.72,
      stiffness: reducedMotion ? 1000 : 230,
      toValue: 1,
      useNativeDriver: true,
    });
    const confirm = Animated.sequence([
      Animated.delay(reducedMotion ? 0 : 260),
      Animated.spring(confirmation, {
        damping: reducedMotion ? 100 : 14,
        mass: 0.62,
        stiffness: reducedMotion ? 1000 : 280,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]);
    enter.start();
    confirm.start();
    return () => {
      enter.stop();
      confirm.stop();
    };
  }, [arrival, confirmation, reducedMotion]);

  return (
    <View
      accessibilityLabel="E-mail de confirmação enviado"
      accessibilityRole="image"
      style={styles.markStage}
    >
      <Animated.View
        style={[
          styles.mailFrame,
          {
            opacity: arrival,
            transform: [
              {
                scale: arrival.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.72, 1],
                }),
              },
              {
                translateY: arrival.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.mailHighlight} />
        <Mail color={palette.primary} size={30} strokeWidth={1.65} />
        <Animated.View
          style={[
            styles.checkBadge,
            {
              opacity: confirmation,
              transform: [
                {
                  scale: confirmation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.25, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Check color="#07110E" size={13} strokeWidth={2.8} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Instruction({ index, children }: { index: string; children: string }) {
  return (
    <View style={styles.instruction}>
      <View style={styles.instructionIndex}>
        <Text style={styles.instructionIndexText}>{index}</Text>
      </View>
      <Text style={styles.instructionText}>{children}</Text>
    </View>
  );
}

export default function ConfirmEmailRoute() {
  const params = useLocalSearchParams<{ email?: string }>();
  const maskedEmail = maskEmail(params.email);

  const goToSignIn = () => {
    void triggerHaptic('selection');
    router.replace('/sign-in');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WelcomeAmbientBackground dark />
      <Screen
        background="transparent"
        contentContainerStyle={styles.screen}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView delay={20} distance={8} style={styles.topBar}>
          <AnimatedPressable
            accessibilityLabel="Voltar"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft color={palette.text} size={20} strokeWidth={1.8} />
          </AnimatedPressable>
          <Text style={styles.topLabel}>CONFIRMAÇÃO</Text>
        </FadeInView>

        <View style={styles.hero}>
          <DeliveredMark />
          <FadeInView delay={90} distance={10} style={styles.heading}>
            <Text align="center" style={styles.title}>
              Só falta confirmar seu e-mail.
            </Text>
            <Text align="center" style={styles.subtitle}>
              Enviamos um link seguro para concluir a criação da sua conta.
            </Text>
          </FadeInView>

          {maskedEmail ? (
            <FadeInView delay={130} distance={8} style={styles.emailPill}>
              <Mail color={palette.primary} size={16} strokeWidth={1.8} />
              <Text style={styles.email}>{maskedEmail}</Text>
            </FadeInView>
          ) : null}
        </View>

        <FadeInView delay={170} distance={12} style={styles.guideCard}>
          <Text style={styles.guideEyebrow}>PRÓXIMOS PASSOS</Text>
          <View style={styles.instructions}>
            <Instruction index="1">
              Abra a mensagem enviada pelo ResolveMEI.
            </Instruction>
            <Instruction index="2">
              Toque no link para confirmar seu endereço.
            </Instruction>
            <Instruction index="3">
              Volte ao aplicativo e entre normalmente.
            </Instruction>
          </View>
          <View style={styles.spamNote}>
            <Text style={styles.spamText}>
              Não encontrou? Confira a caixa de spam. A entrega pode levar
              alguns minutos.
            </Text>
          </View>
        </FadeInView>

        <FadeInView delay={210} distance={10} style={styles.actions}>
          <AnimatedPressable
            accessibilityHint="Abre a tela de login"
            accessibilityLabel="Já confirmei, entrar"
            accessibilityRole="button"
            onPress={goToSignIn}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryLabel}>Já confirmei, entrar</Text>
          </AnimatedPressable>
          <AnimatedPressable
            accessibilityLabel="Usei outro e-mail"
            accessibilityRole="button"
            onPress={() => router.replace('/sign-up')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryLabel}>Usei outro e-mail</Text>
          </AnimatedPressable>
        </FadeInView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.background, flex: 1 },
  screen: { gap: 30, paddingBottom: 24, paddingHorizontal: 20, paddingTop: 12 },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  topLabel: {
    color: palette.textMuted,
    fontFamily: 'Manrope_700Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    lineHeight: 14,
  },
  hero: { alignItems: 'center', gap: 19 },
  markStage: {
    alignItems: 'center',
    height: 94,
    justifyContent: 'center',
    width: 94,
  },
  mailFrame: {
    alignItems: 'center',
    backgroundColor: '#0C1714',
    borderColor: 'rgba(69,230,176,0.25)',
    borderRadius: 21,
    borderWidth: 1,
    height: 74,
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
    shadowColor: palette.primary,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    width: 74,
  },
  mailHighlight: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 1,
    height: 1,
    left: 16,
    position: 'absolute',
    right: 16,
    top: 1,
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderColor: palette.background,
    borderRadius: 11,
    borderWidth: 3,
    bottom: -5,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: -5,
    width: 24,
  },
  heading: { alignItems: 'center', gap: 10 },
  title: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 29,
    letterSpacing: -1,
    lineHeight: 35,
    maxWidth: 350,
  },
  subtitle: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 340,
  },
  emailPill: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  email: {
    color: palette.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  guideCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  guideEyebrow: {
    color: palette.textMuted,
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    letterSpacing: 1.3,
    lineHeight: 13,
  },
  instructions: { gap: 15 },
  instruction: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  instructionIndex: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.borderStrong,
    borderRadius: 15,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  instructionIndexText: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    lineHeight: 15,
  },
  instructionText: {
    color: palette.textSecondary,
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  spamNote: {
    backgroundColor: palette.surfaceRaised,
    borderRadius: 12,
    padding: 12,
  },
  spamText: {
    color: palette.textMuted,
    fontFamily: 'Manrope_400Regular',
    fontSize: 11,
    lineHeight: 17,
  },
  actions: { gap: 10 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryLabel: {
    color: '#07110E',
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryLabel: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
});
