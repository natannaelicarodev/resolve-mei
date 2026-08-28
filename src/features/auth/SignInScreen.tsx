import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import {
  AnimatedPressable,
  FadeInView,
  useReducedMotion,
} from '@/components/motion';
import { Button, InlineFeedback, Input, Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { getThemeShadows, radii, spacing, useTheme } from '@/theme';
import { signIn } from './api';
import { signInSchema } from './schemas';
import type { SignInData } from './schemas';

function LoginIllustration() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [float] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          duration: 2200,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          duration: 2200,
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [float, reducedMotion]);

  const up = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const down = float.interpolate({ inputRange: [0, 1], outputRange: [-5, 3] });

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.illustration}
    >
      <View
        style={[
          styles.illustrationGlow,
          { backgroundColor: colors.primarySubtle },
        ]}
      />
      <View style={[styles.connection, { backgroundColor: colors.border }]} />
      <Animated.View
        style={[
          styles.character,
          styles.characterLeft,
          { backgroundColor: colors.surface, transform: [{ translateY: up }] },
        ]}
      >
        <View
          style={[styles.characterHead, { backgroundColor: colors.primary }]}
        >
          <MaterialCommunityIcons
            color={colors.textOnPrimary}
            name="account-tie-outline"
            size={26}
          />
        </View>
        <View style={styles.characterCopy}>
          <View
            style={[styles.copyLine, { backgroundColor: colors.primary }]}
          />
          <View
            style={[
              styles.copyLineShort,
              { backgroundColor: colors.borderStrong },
            ]}
          />
        </View>
      </Animated.View>
      <Animated.View
        style={[
          styles.character,
          styles.characterRight,
          {
            backgroundColor: colors.surface,
            transform: [{ translateY: down }],
          },
        ]}
      >
        <View
          style={[
            styles.characterHead,
            { backgroundColor: colors.successSubtle },
          ]}
        >
          <MaterialCommunityIcons
            color={colors.success}
            name="storefront-outline"
            size={26}
          />
        </View>
        <View style={styles.characterCopy}>
          <View
            style={[styles.copyLine, { backgroundColor: colors.success }]}
          />
          <View
            style={[
              styles.copyLineShort,
              { backgroundColor: colors.borderStrong },
            ]}
          />
        </View>
      </Animated.View>
      <View
        style={[styles.floatingBadge, { backgroundColor: colors.accentSubtle }]}
      >
        <MaterialCommunityIcons
          color={colors.accent}
          name="chart-line"
          size={20}
        />
      </View>
    </View>
  );
}

export function SignInScreen() {
  const { colors, resolvedTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = async (data: SignInData) => {
    try {
      await signIn(data.email, data.password);
    } catch (error) {
      setError('root', { message: normalizeError(error).message });
    }
  };

  return (
    <Screen contentContainerStyle={styles.screen} keyboardAvoiding>
      <LinearGradient
        colors={[colors.primarySubtle, colors.background, colors.background]}
        end={{ x: 0.8, y: 0.7 }}
        start={{ x: 0, y: 0 }}
        style={styles.background}
      />
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
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <Text style={styles.title} variant="pageTitle">
              Seu negócio, organizado.
            </Text>
            <Text color="textSecondary">
              Entre para acompanhar clientes, serviços e orçamentos em um só
              lugar.
            </Text>
          </View>
          <LoginIllustration />
        </View>
        <FadeInView
          delay={100}
          style={[
            styles.form,
            { backgroundColor: colors.surface, borderColor: colors.border },
            getThemeShadows(resolvedTheme).floating,
          ]}
        >
          <View style={styles.formHeading}>
            <Text variant="cardTitle">Bem-vindo de volta</Text>
            <Text color="textSecondary" variant="caption">
              Acesse sua conta para continuar.
            </Text>
          </View>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
                keyboardType="email-address"
                label="E-mail"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                returnKeyType="next"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <Input
                autoComplete="current-password"
                error={errors.password?.message}
                label="Senha"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                returnKeyType="done"
                rightAccessory={
                  <AnimatedPressable
                    accessibilityLabel={
                      showPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                    accessibilityRole="button"
                    onPress={() => setShowPassword((current) => !current)}
                    style={styles.eyeButton}
                  >
                    <MaterialCommunityIcons
                      color={colors.textMuted}
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                    />
                  </AnimatedPressable>
                }
                secureTextEntry={!showPassword}
                value={field.value}
              />
            )}
          />
          <Link
            accessibilityRole="link"
            href="/forgot-password"
            style={[styles.forgotLink, { color: colors.primary }]}
          >
            Esqueci minha senha
          </Link>
          {errors.root?.message ? (
            <InlineFeedback message={errors.root.message} variant="error" />
          ) : null}
          <Button
            label="Entrar"
            loading={isSubmitting}
            onPress={() => void handleSubmit(submit)()}
          />
          <View style={styles.signupRow}>
            <Text color="textSecondary" variant="caption">
              Primeiro acesso?
            </Text>
            <Link
              href="/sign-up"
              style={[styles.createLink, { color: colors.primary }]}
            >
              Criar conta
            </Link>
          </View>
        </FadeInView>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  background: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  screen: {
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  content: { gap: spacing.md, width: '100%' },
  brand: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  logo: { height: 32, width: 32 },
  hero: { minHeight: 150, position: 'relative' },
  heroCopy: {
    gap: spacing.sm,
    maxWidth: '68%',
    paddingTop: spacing.sm,
    zIndex: 2,
  },
  title: { fontSize: 27, lineHeight: 32 },
  illustration: {
    bottom: 0,
    height: 142,
    position: 'absolute',
    right: -20,
    width: 176,
  },
  illustrationGlow: {
    borderRadius: 80,
    height: 138,
    opacity: 0.72,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 138,
  },
  connection: {
    height: 2,
    position: 'absolute',
    right: 34,
    top: 72,
    transform: [{ rotate: '-18deg' }],
    width: 92,
  },
  character: {
    alignItems: 'center',
    borderRadius: radii.medium,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    position: 'absolute',
  },
  characterLeft: { left: 0, top: 16 },
  characterRight: { right: 0, top: 78 },
  characterHead: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  characterCopy: { gap: 5, width: 34 },
  copyLine: { borderRadius: 3, height: 5, width: 34 },
  copyLineShort: { borderRadius: 3, height: 4, opacity: 0.5, width: 22 },
  floatingBadge: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    top: 24,
    width: 32,
  },
  form: {
    borderRadius: radii.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.md,
  },
  formHeading: { gap: spacing.xs, marginBottom: spacing.xs },
  eyeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    fontSize: 12,
    lineHeight: 18,
    paddingBottom: spacing.xs,
    paddingVertical: spacing.xs,
  },
  signupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingTop: spacing.xs,
  },
  createLink: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    paddingVertical: spacing.xs,
  },
});
