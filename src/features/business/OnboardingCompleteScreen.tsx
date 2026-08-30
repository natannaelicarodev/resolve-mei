import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  FileCheck2,
  Sparkles,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AnimatedPressable,
  FadeInView,
  useReducedMotion,
} from '@/components/motion';
import { WelcomeAmbientBackground } from '@/features/auth/WelcomeScreen';
import { useMyBusiness } from '@/features/business/hooks';
import { triggerHaptic } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';

const palette = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceRaised: '#121212',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  primary: '#45E6B0',
  primarySoft: 'rgba(69,230,176,0.12)',
  text: '#FFFFFF',
  textSecondary: '#A1A1A7',
  textMuted: '#717178',
} as const;

function SuccessSeal() {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(reducedMotion ? 1 : 0));

  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.spring(progress, {
      damping: 15,
      mass: 0.74,
      stiffness: 170,
      toValue: 1,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion]);

  return (
    <Animated.View
      accessibilityLabel="Perfil profissional concluído"
      style={[
        styles.sealOuter,
        {
          opacity: progress,
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 0.72, 1],
                outputRange: [0.62, 1.08, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.sealGlow} />
      <View style={styles.sealInner}>
        <BadgeCheck color={palette.primary} size={37} strokeWidth={1.65} />
      </View>
      <View style={styles.sealBadge}>
        <Sparkles color="#001A12" size={12} strokeWidth={2.2} />
      </View>
    </Animated.View>
  );
}

function ReadinessItem({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <View style={styles.readinessItem}>
      <View style={styles.itemIcon}>
        <Icon color={palette.textSecondary} size={17} strokeWidth={1.75} />
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
      <View style={styles.itemStatus}>
        <BadgeCheck color={palette.primary} size={17} strokeWidth={1.8} />
        <Text style={styles.itemStatusText}>Pronto</Text>
      </View>
    </View>
  );
}

export function OnboardingCompleteScreen() {
  const { user } = useAuth();
  const business = useMyBusiness(user?.id);
  const businessName = business.data?.business_name?.trim();

  const openDashboard = () => {
    void triggerHaptic('selection');
    router.replace('/home');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WelcomeAmbientBackground dark />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.content}>
          <FadeInView delay={30} distance={10} style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow}>CONFIGURAÇÃO CONCLUÍDA</Text>
          </FadeInView>

          <View style={styles.hero}>
            <SuccessSeal />
            <FadeInView delay={140} distance={12} style={styles.heroCopy}>
              <Text style={styles.title}>Seu negócio está pronto.</Text>
              <Text style={styles.subtitle}>
                {businessName
                  ? `${businessName} já tem uma base profissional para começar.`
                  : 'Sua base profissional está organizada para começar.'}
              </Text>
            </FadeInView>
          </View>

          <FadeInView delay={230} distance={14} style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardEyebrow}>BASE DO NEGÓCIO</Text>
                <Text style={styles.cardTitle}>Tudo em ordem</Text>
              </View>
              <View style={styles.readyPill}>
                <View style={styles.readyDot} />
                <Text style={styles.readyPillText}>PRONTO</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <ReadinessItem
              icon={BriefcaseBusiness}
              label="Perfil profissional"
            />
            <ReadinessItem icon={FileCheck2} label="Dados para documentos" />
            <ReadinessItem icon={Sparkles} label="Estrutura do negócio" />
          </FadeInView>

          <FadeInView delay={320} distance={10} style={styles.footer}>
            <Text style={styles.footerHint}>
              Clientes, serviços e orçamentos agora ficam no mesmo lugar.
            </Text>
            <AnimatedPressable
              accessibilityLabel="Abrir meu painel"
              accessibilityRole="button"
              onPress={openDashboard}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryLabel}>Abrir meu painel</Text>
              <View style={styles.arrowBubble}>
                <ArrowRight color="#001A12" size={18} strokeWidth={2} />
              </View>
            </AnimatedPressable>
          </FadeInView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.background, flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 12,
  },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  eyebrowDot: {
    backgroundColor: palette.primary,
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  eyebrow: {
    color: palette.textMuted,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.45,
  },
  hero: { alignItems: 'center', marginTop: 34 },
  sealOuter: {
    alignItems: 'center',
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  sealGlow: {
    backgroundColor: palette.primarySoft,
    borderRadius: 52,
    height: 104,
    position: 'absolute',
    width: 104,
  },
  sealInner: {
    alignItems: 'center',
    backgroundColor: '#071A14',
    borderColor: 'rgba(69,230,176,0.28)',
    borderRadius: 34,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  sealBadge: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderColor: palette.background,
    borderRadius: 12,
    borderWidth: 3,
    bottom: 13,
    height: 25,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    width: 25,
  },
  heroCopy: { alignItems: 'center', marginTop: 18 },
  title: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 30,
    letterSpacing: -1.05,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 9,
    maxWidth: 330,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 34,
    padding: 17,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardEyebrow: {
    color: palette.textMuted,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.25,
  },
  cardTitle: {
    color: palette.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 17,
    marginTop: 4,
  },
  readyPill: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  readyDot: {
    backgroundColor: palette.primary,
    borderRadius: 3,
    height: 5,
    width: 5,
  },
  readyPillText: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    letterSpacing: 0.7,
  },
  divider: {
    backgroundColor: palette.border,
    height: 1,
    marginVertical: 13,
  },
  readinessItem: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 43,
  },
  itemIcon: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  itemLabel: {
    color: palette.textSecondary,
    flex: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 13,
    marginLeft: 11,
  },
  itemStatus: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  itemStatusText: {
    color: palette.primary,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
  },
  footer: { marginTop: 'auto', paddingTop: 18 },
  footerHint: {
    color: palette.textMuted,
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 13,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 15,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 8,
    position: 'relative',
  },
  primaryLabel: {
    color: '#001A12',
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
  },
  arrowBubble: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,26,18,0.10)',
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: 9,
    width: 38,
  },
});
