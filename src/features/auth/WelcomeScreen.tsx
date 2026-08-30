import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  BadgeCheck,
  FileText,
  UserRound,
  WalletCards,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';

import {
  AnimatedPressable,
  FadeInView,
  useReducedMotion,
} from '@/components/motion';
import { Text } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';

const palette = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceRaised: '#121212',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  primary: '#45E6B0',
  primarySoft: 'rgba(69,230,176,0.14)',
  text: '#FFFFFF',
  textSecondary: '#A1A1A7',
  textMuted: '#717178',
} as const;

function AmbientGrid() {
  const reducedMotion = useReducedMotion();
  const [breath] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [breath, reducedMotion]);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <Svg height="54%" viewBox="0 0 390 430" width="100%">
        <Defs>
          <Pattern
            height="22"
            id="welcome-grid"
            patternUnits="userSpaceOnUse"
            width="22"
          >
            <Circle cx="1" cy="1" fill="#FFFFFF" opacity="0.075" r="1" />
          </Pattern>
        </Defs>
        <Rect fill="url(#welcome-grid)" height="430" width="390" />
      </Svg>
      <Animated.View
        style={[
          styles.ambientGlow,
          {
            opacity: breath.interpolate({
              inputRange: [0, 1],
              outputRange: [0.44, 0.72],
            }),
            transform: [
              {
                scale: breath.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1.08],
                }),
              },
            ],
          },
        ]}
      />
      <View style={styles.gridFade} />
    </View>
  );
}

// Shared by the remaining pre-auth screens until each one receives its own redesign.
export function WelcomeAmbientBackground({
  dark: _dark = true,
}: {
  dark?: boolean;
}) {
  return <AmbientGrid />;
}

function BrandMark() {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(progress, {
      damping: 18,
      mass: 0.72,
      stiffness: 220,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const topTransform = reducedMotion
    ? undefined
    : {
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-12, 0],
            }),
          },
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-8, 0],
            }),
          },
        ],
      };
  const bottomTransform = reducedMotion
    ? undefined
    : {
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      };

  return (
    <View accessibilityLabel="ResolveMEI" style={styles.markFrame}>
      <Animated.View style={[styles.markPiece, styles.markTop, topTransform]} />
      <Animated.View
        style={[styles.markPiece, styles.markBottom, bottomTransform]}
      />
      <View style={styles.markCore} />
    </View>
  );
}

function ProductPreview() {
  const reducedMotion = useReducedMotion();
  const [travel] = useState(() => new Animated.Value(0));
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (reducedMotion || trackWidth === 0) return;
    travel.setValue(0);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(travel, {
          duration: 420,
          easing: Easing.out(Easing.cubic),
          isInteraction: false,
          toValue: 0.1,
          useNativeDriver: true,
        }),
        Animated.delay(220),
        Animated.timing(travel, {
          duration: 1050,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 0.36,
          useNativeDriver: true,
        }),
        Animated.delay(260),
        Animated.timing(travel, {
          duration: 1120,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 0.68,
          useNativeDriver: true,
        }),
        Animated.delay(260),
        Animated.timing(travel, {
          duration: 1080,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 0.96,
          useNativeDriver: true,
        }),
        Animated.delay(220),
        Animated.timing(travel, {
          duration: 340,
          easing: Easing.out(Easing.cubic),
          isInteraction: false,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.delay(1250),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [reducedMotion, trackWidth, travel]);

  return (
    <FadeInView delay={120} distance={14} style={styles.previewShell}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewEyebrow}>COMO FUNCIONA</Text>
        <Text style={styles.previewTitle}>
          Do cliente ao pagamento, tudo conectado.
        </Text>
      </View>

      <View
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={styles.journey}
      >
        <View style={styles.journeyTrack} />
        {trackWidth > 0 && !reducedMotion ? (
          <Animated.View
            style={[
              styles.journeyPulse,
              {
                opacity: travel.interpolate({
                  inputRange: [0, 0.08, 0.92, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateX: travel.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, trackWidth - 10],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : null}

        <JourneyStep
          Icon={UserRound}
          label="Cliente"
          progress={travel}
          threshold={0.02}
        />
        <JourneyStep
          Icon={FileText}
          label="Orçamento"
          progress={travel}
          threshold={0.28}
        />
        <JourneyStep
          Icon={BadgeCheck}
          label="Aprovação"
          progress={travel}
          threshold={0.6}
        />
        <JourneyStep
          Icon={WalletCards}
          label="Recebimento"
          progress={travel}
          threshold={0.9}
        />
      </View>
    </FadeInView>
  );
}

function JourneyStep({
  Icon,
  label,
  progress,
  threshold,
}: {
  Icon: LucideIcon;
  label: string;
  progress: Animated.Value;
  threshold: number;
}) {
  const reducedMotion = useReducedMotion();
  const activeOpacity = reducedMotion
    ? 1
    : progress.interpolate({
        inputRange: [0, threshold, Math.min(threshold + 0.08, 1), 1],
        outputRange: [0, 0, 1, 1],
      });

  return (
    <View style={styles.journeyStep}>
      <View style={styles.journeyIcon}>
        <Icon color={palette.textSecondary} size={16} strokeWidth={1.8} />
        <Animated.View
          style={[styles.journeyIconActive, { opacity: activeOpacity }]}
        >
          <Icon color={palette.primary} size={16} strokeWidth={2} />
        </Animated.View>
      </View>
      <Text numberOfLines={1} style={styles.journeyLabel}>
        {label}
      </Text>
    </View>
  );
}

export function WelcomeScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 720;

  const navigate = (destination: '/sign-up' | '/sign-in') => {
    void triggerHaptic('selection');
    router.push(destination);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <AmbientGrid />
      <View style={[styles.content, compact && styles.contentCompact]}>
        <FadeInView delay={20} distance={10} style={styles.brandRow}>
          <BrandMark />
          <Text style={styles.brandName}>ResolveMEI</Text>
        </FadeInView>

        <View style={styles.hero}>
          <FadeInView delay={60} distance={12}>
            <Text style={[styles.title, compact && styles.titleCompact]}>
              Seu negócio, claro em cada decisão.
            </Text>
            <Text style={styles.message}>
              Clientes, serviços e cobranças organizados em uma experiência
              simples, segura e feita para você crescer.
            </Text>
          </FadeInView>
          <ProductPreview />
        </View>

        <FadeInView delay={200} distance={12} style={styles.actions}>
          <AnimatedPressable
            accessibilityHint="Inicia o cadastro do seu negócio"
            accessibilityLabel="Criar conta"
            accessibilityRole="button"
            onPress={() => navigate('/sign-up')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryLabel}>Criar minha conta</Text>
            <View style={styles.buttonArrow}>
              <Text style={styles.buttonArrowLabel}>→</Text>
            </View>
          </AnimatedPressable>

          <AnimatedPressable
            accessibilityHint="Abre a tela de acesso"
            accessibilityLabel="Já tenho uma conta"
            accessibilityRole="button"
            onPress={() => navigate('/sign-in')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryLabel}>Já tenho uma conta</Text>
          </AnimatedPressable>
        </FadeInView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.background, flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  contentCompact: { paddingBottom: 12, paddingTop: 8 },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  brandName: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 16,
    letterSpacing: -0.35,
    lineHeight: 22,
  },
  markFrame: {
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.borderStrong,
    borderRadius: 11,
    borderWidth: 1,
    height: 38,
    overflow: 'hidden',
    position: 'relative',
    width: 38,
  },
  markPiece: { backgroundColor: palette.primary, position: 'absolute' },
  markTop: {
    borderBottomRightRadius: 8,
    height: 13,
    left: 8,
    top: 7,
    width: 14,
  },
  markBottom: {
    borderTopLeftRadius: 8,
    bottom: 7,
    height: 13,
    right: 8,
    width: 14,
  },
  markCore: {
    backgroundColor: palette.background,
    borderRadius: 5,
    height: 7,
    left: 16,
    position: 'absolute',
    top: 16,
    transform: [{ rotate: '45deg' }],
    width: 7,
  },
  hero: { gap: 24 },
  title: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 38,
    letterSpacing: -1.5,
    lineHeight: 44,
    maxWidth: 360,
  },
  titleCompact: { fontSize: 32, lineHeight: 38 },
  message: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
    maxWidth: 350,
  },
  previewShell: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 38,
  },
  previewHeader: {
    gap: 5,
  },
  previewEyebrow: {
    color: palette.textMuted,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.3,
    lineHeight: 13,
  },
  previewTitle: {
    color: palette.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 16,
    letterSpacing: -0.25,
    lineHeight: 22,
    marginTop: 3,
  },
  journey: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    position: 'relative',
  },
  journeyTrack: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    height: 1,
    left: 18,
    position: 'absolute',
    right: 18,
    top: 18,
  },
  journeyPulse: {
    backgroundColor: palette.primary,
    borderRadius: 5,
    height: 6,
    left: 0,
    position: 'absolute',
    shadowColor: palette.primary,
    shadowOpacity: 0.7,
    shadowRadius: 7,
    top: 15.5,
    width: 6,
  },
  journeyStep: {
    alignItems: 'center',
    gap: 7,
    width: 62,
    zIndex: 1,
  },
  journeyIcon: {
    alignItems: 'center',
    backgroundColor: palette.surfaceRaised,
    borderColor: palette.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  journeyIconActive: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: 18,
    borderColor: 'rgba(69,230,176,0.34)',
    borderWidth: 1,
    bottom: -1,
    justifyContent: 'center',
    left: -1,
    position: 'absolute',
    right: -1,
    top: -1,
  },
  journeyLabel: {
    color: palette.textMuted,
    fontFamily: 'Manrope_500Medium',
    fontSize: 9,
    lineHeight: 13,
    textAlign: 'center',
    width: 64,
  },
  actions: { gap: 10 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    position: 'relative',
  },
  primaryLabel: {
    color: '#07110E',
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  buttonArrow: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 13,
    width: 30,
  },
  buttonArrowLabel: {
    color: '#07110E',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 20,
    lineHeight: 23,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 54,
  },
  secondaryLabel: {
    color: palette.text,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 14,
    letterSpacing: -0.1,
    lineHeight: 20,
  },
  ambientGlow: {
    backgroundColor: 'rgba(69,230,176,0.11)',
    borderRadius: 190,
    height: 380,
    left: -70,
    position: 'absolute',
    top: -170,
    width: 380,
  },
  gridFade: {
    backgroundColor: 'rgba(0,0,0,0.58)',
    height: 100,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 330,
  },
});
