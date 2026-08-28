import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import {
  AnimatedPressable,
  FadeInView,
  useReducedMotion,
} from '@/components/motion';
import { Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

const palettes = {
  dark: {
    background: '#14161A',
    border: '#2C3037',
    surface: '#24272D',
    accent: '#2DD4BF',
    textPrimary: '#F2F2F0',
    textSecondary: '#A7A9AE',
    textMuted: '#6E7076',
  },
  light: {
    background: '#EEF0F2',
    border: '#DADDE1',
    surface: '#FFFFFF',
    accent: '#0D9488',
    textPrimary: '#14161A',
    textSecondary: '#55585F',
    textMuted: '#85888E',
  },
} as const;

function AmbientBackground({ dark }: { dark: boolean }) {
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));
  const palette = dark ? palettes.dark : palettes.light;
  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          isInteraction: false,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, reducedMotion]);
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  return (
    <View
      accessibilityElementsHidden
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <Svg height="100%" viewBox="0 0 390 760" width="100%">
        <Defs>
          <Pattern
            height="18"
            id="dots"
            patternUnits="userSpaceOnUse"
            width="18"
          >
            <Circle
              cx="1.5"
              cy="1.5"
              fill={palette.border}
              opacity={dark ? 0.75 : 0.52}
              r="1.15"
            />
          </Pattern>
        </Defs>
        <Rect fill="url(#dots)" height="430" opacity={0.72} width="390" />
        <Path
          d="M0 350C76 330 119 371 189 354C259 337 302 296 390 321"
          fill="none"
          opacity={0.12}
          stroke={palette.accent}
          strokeWidth="1"
        />
      </Svg>
      <Animated.View style={[styles.glow, { opacity, transform: [{ scale }] }]}>
        <Svg height="100%" viewBox="0 0 300 300" width="100%">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop
                offset="0"
                stopColor={palette.accent}
                stopOpacity={dark ? 0.32 : 0.2}
              />
              <Stop
                offset="0.44"
                stopColor={palette.accent}
                stopOpacity={dark ? 0.13 : 0.08}
              />
              <Stop offset="1" stopColor={palette.accent} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="150" cy="150" fill="url(#glow)" r="150" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function WelcomeScreen() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const palette = dark ? palettes.dark : palettes.light;
  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: palette.background }]}
    >
      <AmbientBackground dark={dark} />
      <FadeInView style={styles.layout}>
        <View style={styles.hero}>
          <View
            style={[
              styles.brandMark,
              { backgroundColor: palette.surface, borderColor: palette.accent },
            ]}
          >
            <MaterialCommunityIcons
              color={palette.accent}
              name="file-document-outline"
              size={30}
            />
          </View>
          <Text style={[styles.brandName, { color: palette.textPrimary }]}>
            ResolveMEI
          </Text>
          <Text style={[styles.brandTag, { color: palette.textMuted }]}>
            Painel do seu negócio
          </Text>
        </View>
        <View style={styles.body}>
          <View style={styles.copy}>
            <Text
              align="center"
              style={[styles.title, { color: palette.textPrimary }]}
            >
              Organize seu negócio com clareza
            </Text>
            <Text
              align="center"
              style={[styles.message, { color: palette.textSecondary }]}
            >
              Clientes, serviços e orçamentos em um só lugar sem planilha, sem
              complicação.
            </Text>
          </View>
          <View style={styles.actions}>
            <AnimatedPressable
              accessibilityRole="button"
              onPress={() => router.push('/sign-up')}
              style={[
                styles.primaryButton,
                { backgroundColor: palette.accent },
              ]}
            >
              <Text style={styles.primaryLabel}>Criar conta</Text>
            </AnimatedPressable>
            <AnimatedPressable
              accessibilityRole="button"
              onPress={() => router.push('/sign-in')}
              style={[styles.secondaryButton, { borderColor: palette.border }]}
            >
              <Text
                style={[styles.secondaryLabel, { color: palette.textPrimary }]}
              >
                Já tenho conta
              </Text>
            </AnimatedPressable>
          </View>
        </View>
      </FadeInView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  layout: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    height: 300,
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  glow: {
    height: 300,
    left: '50%',
    marginLeft: -150,
    position: 'absolute',
    top: -24,
    width: 300,
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 2,
    height: 58,
    justifyContent: 'center',
    marginBottom: 14,
    width: 58,
  },
  brandName: { fontSize: 22, fontWeight: '800', lineHeight: 29 },
  brandTag: { fontSize: 12, fontWeight: '500', lineHeight: 18, marginTop: 3 },
  body: { gap: spacing.lg },
  copy: { gap: spacing.sm },
  title: { fontSize: 25, fontWeight: '800', lineHeight: 34 },
  message: { fontSize: 14, lineHeight: 21 },
  actions: { gap: 10 },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 5,
    justifyContent: 'center',
    minHeight: 56,
  },
  primaryLabel: { color: '#14161A', fontSize: 15, fontWeight: '800' },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 56,
  },
  secondaryLabel: { fontSize: 15, fontWeight: '700' },
});
