import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { triggerHaptic } from '@/lib/haptics';
import { signIn } from './api';
import { signInSchema } from './schemas';
import type { SignInData } from './schemas';
import { WelcomeAmbientBackground } from './WelcomeScreen';

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
  danger: '#FF6B6B',
  dangerSoft: '#240D0F',
} as const;

export function SignInScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus] = useState(() => new Animated.Value(0));
  const [passwordFocus] = useState(() => new Animated.Value(0));
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
      void triggerHaptic('success');
    } catch (error) {
      void triggerHaptic('error');
      setError('root', { message: normalizeError(error).message });
    }
  };

  const animateFocus = (progress: Animated.Value, toValue: 0 | 1) => {
    progress.stopAnimation();
    Animated.timing(progress, {
      duration: 140,
      toValue,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WelcomeAmbientBackground dark />
      <Screen
        background="transparent"
        contentContainerStyle={styles.screen}
        keyboardAvoiding
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
          <View style={styles.securePill}>
            <ShieldCheck color={palette.primary} size={14} strokeWidth={1.8} />
            <Text style={styles.secureLabel}>ACESSO SEGURO</Text>
          </View>
        </FadeInView>

        <FadeInView delay={60} distance={10} style={styles.heading}>
          <Text style={styles.title}>Bem-vindo de volta.</Text>
          <Text style={styles.subtitle}>
            Entre para continuar cuidando do seu negócio com clareza.
          </Text>
        </FadeInView>

        <FadeInView delay={100} distance={12} style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <View style={styles.fieldBlock}>
                <Animated.Text
                  style={[
                    styles.label,
                    {
                      color: emailFocus.interpolate({
                        inputRange: [0, 1],
                        outputRange: [palette.textSecondary, palette.primary],
                      }),
                    },
                  ]}
                >
                  E-mail
                </Animated.Text>
                <Animated.View
                  style={[
                    styles.inputShell,
                    {
                      backgroundColor: emailFocus.interpolate({
                        inputRange: [0, 1],
                        outputRange: [palette.surface, palette.surfaceRaised],
                      }),
                      borderColor: emailFocus.interpolate({
                        inputRange: [0, 1],
                        outputRange: [palette.border, 'rgba(69,230,176,0.72)'],
                      }),
                    },
                    errors.email?.message && styles.inputShellError,
                  ]}
                >
                  <Mail color={palette.textMuted} size={19} strokeWidth={1.8} />
                  <TextInput
                    accessibilityHint={errors.email?.message}
                    accessibilityLabel="E-mail"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    onBlur={() => {
                      animateFocus(emailFocus, 0);
                      field.onBlur();
                    }}
                    onChangeText={field.onChange}
                    onFocus={() => animateFocus(emailFocus, 1)}
                    placeholder="voce@exemplo.com"
                    placeholderTextColor={palette.textMuted}
                    returnKeyType="next"
                    selectionColor={palette.primary}
                    style={styles.input}
                    textContentType="emailAddress"
                    value={field.value}
                  />
                </Animated.View>
                {errors.email?.message ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={styles.fieldError}
                  >
                    {errors.email.message}
                  </Text>
                ) : null}
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <View style={styles.fieldBlock}>
                <View style={styles.passwordLabelRow}>
                  <Animated.Text
                    style={[
                      styles.label,
                      {
                        color: passwordFocus.interpolate({
                          inputRange: [0, 1],
                          outputRange: [palette.textSecondary, palette.primary],
                        }),
                      },
                    ]}
                  >
                    Senha
                  </Animated.Text>
                  <AnimatedPressable
                    accessibilityRole="link"
                    onPress={() => router.push('/forgot-password')}
                    style={styles.forgotButton}
                  >
                    <Text style={styles.forgot}>Esqueci minha senha</Text>
                  </AnimatedPressable>
                </View>
                <Animated.View
                  style={[
                    styles.inputShell,
                    {
                      backgroundColor: passwordFocus.interpolate({
                        inputRange: [0, 1],
                        outputRange: [palette.surface, palette.surfaceRaised],
                      }),
                      borderColor: passwordFocus.interpolate({
                        inputRange: [0, 1],
                        outputRange: [palette.border, 'rgba(69,230,176,0.72)'],
                      }),
                    },
                    errors.password?.message && styles.inputShellError,
                  ]}
                >
                  <LockKeyhole
                    color={palette.textMuted}
                    size={19}
                    strokeWidth={1.8}
                  />
                  <TextInput
                    accessibilityHint={errors.password?.message}
                    accessibilityLabel="Senha"
                    autoComplete="current-password"
                    onBlur={() => {
                      animateFocus(passwordFocus, 0);
                      field.onBlur();
                    }}
                    onChangeText={field.onChange}
                    onFocus={() => animateFocus(passwordFocus, 1)}
                    onSubmitEditing={() => void handleSubmit(submit)()}
                    placeholder="Sua senha"
                    placeholderTextColor={palette.textMuted}
                    returnKeyType="done"
                    secureTextEntry={!showPassword}
                    selectionColor={palette.primary}
                    style={styles.input}
                    textContentType="password"
                    value={field.value}
                  />
                  <AnimatedPressable
                    accessibilityLabel={
                      showPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                    accessibilityRole="button"
                    hitSlop={4}
                    onPress={() => setShowPassword((current) => !current)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff
                        color={palette.textSecondary}
                        size={20}
                        strokeWidth={1.8}
                      />
                    ) : (
                      <Eye
                        color={palette.textSecondary}
                        size={20}
                        strokeWidth={1.8}
                      />
                    )}
                  </AnimatedPressable>
                </Animated.View>
                {errors.password?.message ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={styles.fieldError}
                  >
                    {errors.password.message}
                  </Text>
                ) : null}
              </View>
            )}
          />

          {errors.root?.message ? (
            <View
              accessibilityLiveRegion="polite"
              accessibilityRole="alert"
              style={styles.errorBox}
            >
              <View style={styles.errorIcon}>
                <Text style={styles.errorIconText}>!</Text>
              </View>
              <View style={styles.errorCopy}>
                <Text style={styles.errorTitle}>Não conseguimos entrar</Text>
                <Text style={styles.errorMessage}>{errors.root.message}</Text>
              </View>
            </View>
          ) : null}

          <AnimatedPressable
            accessibilityLabel="Entrar"
            accessibilityRole="button"
            accessibilityState={{
              busy: isSubmitting,
              disabled: isSubmitting,
            }}
            disabled={isSubmitting}
            onPress={() => void handleSubmit(submit)()}
            style={styles.primaryButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#07110E" size="small" />
            ) : (
              <Text style={styles.primaryLabel}>Entrar</Text>
            )}
          </AnimatedPressable>
        </FadeInView>

        <FadeInView delay={150} distance={8} style={styles.signUpFooter}>
          <Text style={styles.signUpPrompt}>Novo no ResolveMEI?</Text>
          <AnimatedPressable
            accessibilityLabel="Criar conta"
            accessibilityRole="link"
            onPress={() => router.replace('/sign-up')}
            style={styles.signUpLinkButton}
          >
            <Text style={styles.signUpLabel}>Criar conta</Text>
          </AnimatedPressable>
        </FadeInView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.background, flex: 1 },
  screen: {
    gap: 30,
    justifyContent: 'center',
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
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
  securePill: {
    alignItems: 'center',
    backgroundColor: palette.primarySoft,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  secureLabel: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    letterSpacing: 1,
    lineHeight: 12,
  },
  heading: { gap: 10 },
  title: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 34,
    letterSpacing: -1.2,
    lineHeight: 40,
  },
  subtitle: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 350,
  },
  form: { gap: 19 },
  fieldBlock: { gap: 7 },
  label: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  passwordLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  forgotButton: { justifyContent: 'center', minHeight: 32 },
  forgot: {
    color: palette.primary,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 12,
    lineHeight: 17,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    minHeight: 56,
    overflow: 'hidden',
    paddingLeft: 15,
  },
  inputShellError: { borderColor: palette.danger },
  input: {
    color: palette.text,
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    minHeight: 54,
    paddingRight: 12,
    paddingVertical: 0,
  },
  eyeButton: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  fieldError: {
    color: palette.danger,
    fontFamily: 'Manrope_500Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  errorBox: {
    alignItems: 'flex-start',
    backgroundColor: palette.dangerSoft,
    borderColor: 'rgba(255,107,107,0.24)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 13,
  },
  errorIcon: {
    alignItems: 'center',
    borderColor: palette.danger,
    borderRadius: 9,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    marginTop: 1,
    width: 20,
  },
  errorIconText: {
    color: palette.danger,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: 15,
  },
  errorCopy: { flex: 1, gap: 3 },
  errorTitle: {
    color: '#FF9999',
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  errorMessage: {
    color: '#D7A6A6',
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    lineHeight: 17,
  },
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
    lineHeight: 20,
  },
  signUpFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 48,
  },
  signUpPrompt: {
    color: palette.textMuted,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  signUpLinkButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 3,
  },
  signUpLabel: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    lineHeight: 17,
  },
});
