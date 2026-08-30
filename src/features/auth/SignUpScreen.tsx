import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react-native';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { triggerHaptic } from '@/lib/haptics';
import { signUp } from './api';
import { passwordRequirementChecks } from './PasswordRequirements';
import { signUpSchema } from './schemas';
import type { SignUpData } from './schemas';
import { WelcomeAmbientBackground } from './WelcomeScreen';

const palette = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceRaised: '#121212',
  surfacePressed: '#171719',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  primary: '#45E6B0',
  text: '#FFFFFF',
  textSecondary: '#A1A1A7',
  textMuted: '#717178',
  danger: '#FF6B6B',
  dangerSoft: '#240D0F',
} as const;

function SignUpField({
  error,
  icon,
  label,
  onBlur,
  onFocus,
  rightAccessory,
  ...props
}: TextInputProps & {
  error?: string;
  icon: ReactNode;
  label: string;
  rightAccessory?: ReactNode;
}) {
  const [focusProgress] = useState(() => new Animated.Value(0));
  const animateFocus = (toValue: 0 | 1) => {
    focusProgress.stopAnimation();
    Animated.timing(focusProgress, {
      duration: 140,
      toValue,
      useNativeDriver: false,
    }).start();
  };

  return (
    <View style={styles.fieldBlock}>
      <Animated.Text
        style={[
          styles.label,
          {
            color: focusProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [palette.textSecondary, palette.primary],
            }),
          },
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.View
        style={[
          styles.inputShell,
          {
            backgroundColor: focusProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [palette.surface, palette.surfaceRaised],
            }),
            borderColor: focusProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [palette.border, 'rgba(69,230,176,0.72)'],
            }),
          },
          error && styles.inputShellError,
        ]}
      >
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={styles.inputIcon}
        >
          {icon}
        </View>
        <TextInput
          accessibilityHint={error}
          accessibilityLabel={label}
          onBlur={(event) => {
            animateFocus(0);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            animateFocus(1);
            onFocus?.(event);
          }}
          placeholderTextColor={palette.textMuted}
          selectionColor={palette.primary}
          style={styles.input}
          {...props}
        />
        {rightAccessory}
      </Animated.View>
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function PasswordEye({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <AnimatedPressable
      accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={styles.eyeButton}
    >
      <Icon color={palette.textSecondary} size={20} strokeWidth={1.8} />
    </AnimatedPressable>
  );
}

export function SignUpScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
  });
  const password = useWatch({ control, name: 'password' });

  const submit = async (data: SignUpData) => {
    try {
      const session = await signUp(data);
      void triggerHaptic('success');
      router.replace(
        session
          ? '/onboarding'
          : { pathname: '/confirm-email', params: { email: data.email } },
      );
    } catch (error) {
      void triggerHaptic('error');
      setError('root', { message: normalizeError(error).message });
    }
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
          <Text style={styles.topLabel}>NOVA CONTA</Text>
        </FadeInView>

        <FadeInView delay={60} distance={10} style={styles.heading}>
          <Text style={styles.title}>Vamos começar pelo essencial.</Text>
          <Text style={styles.subtitle}>
            Crie seu acesso agora. Os dados do negócio entram na próxima etapa.
          </Text>
        </FadeInView>

        <FadeInView delay={100} distance={12} style={styles.form}>
          <Controller
            control={control}
            name="fullName"
            render={({ field }) => (
              <SignUpField
                autoCapitalize="words"
                autoComplete="name"
                error={errors.fullName?.message}
                icon={
                  <UserRound
                    color={palette.textMuted}
                    size={19}
                    strokeWidth={1.8}
                  />
                }
                label="Nome completo"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Como você se chama?"
                returnKeyType="next"
                textContentType="name"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <SignUpField
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
                icon={
                  <Mail color={palette.textMuted} size={19} strokeWidth={1.8} />
                }
                keyboardType="email-address"
                label="E-mail"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="voce@exemplo.com"
                returnKeyType="next"
                textContentType="emailAddress"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <SignUpField
                accessibilityHint="Mínimo de 8 caracteres, com maiúscula, minúscula e número"
                autoComplete="new-password"
                error={errors.password?.message}
                icon={
                  <LockKeyhole
                    color={palette.textMuted}
                    size={19}
                    strokeWidth={1.8}
                  />
                }
                label="Senha"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Crie uma senha segura"
                rightAccessory={
                  <PasswordEye
                    onPress={() => setShowPassword((current) => !current)}
                    visible={showPassword}
                  />
                }
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                value={field.value}
              />
            )}
          />

          <View
            accessibilityLabel="Requisitos da senha"
            style={styles.requirements}
          >
            <Text style={styles.requirementsTitle}>SUA SENHA PRECISA TER</Text>
            <View style={styles.requirementsGrid}>
              {passwordRequirementChecks.map((requirement) => {
                const met = requirement.test(password);
                return (
                  <View
                    accessible
                    accessibilityLabel={`${requirement.label}: ${met ? 'atendido' : 'pendente'}`}
                    key={requirement.label}
                    style={styles.requirement}
                  >
                    <View
                      style={[
                        styles.requirementMark,
                        met && styles.requirementMarkMet,
                      ]}
                    >
                      {met ? (
                        <Check color="#07110E" size={10} strokeWidth={2.6} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.requirementText,
                        met && styles.requirementTextMet,
                      ]}
                    >
                      {requirement.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <SignUpField
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                icon={
                  <LockKeyhole
                    color={palette.textMuted}
                    size={19}
                    strokeWidth={1.8}
                  />
                }
                label="Confirmar senha"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Digite a senha novamente"
                returnKeyType="done"
                rightAccessory={
                  <PasswordEye
                    onPress={() => setShowConfirmation((current) => !current)}
                    visible={showConfirmation}
                  />
                }
                secureTextEntry={!showConfirmation}
                textContentType="newPassword"
                value={field.value}
              />
            )}
          />

          <Controller
            control={control}
            name="acceptedTerms"
            render={({ field }) => (
              <View>
                <AnimatedPressable
                  accessibilityLabel="Li e aceito os termos de uso"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: field.value }}
                  onPress={() => {
                    void triggerHaptic('selection');
                    field.onChange(!field.value);
                  }}
                  style={styles.termsRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      field.value && styles.checkboxChecked,
                    ]}
                  >
                    {field.value ? (
                      <Check color="#07110E" size={15} strokeWidth={2.7} />
                    ) : null}
                  </View>
                  <Text style={styles.termsText}>
                    Li e aceito os{' '}
                    <Text style={styles.termsLink}>termos de uso</Text>
                  </Text>
                </AnimatedPressable>
                {errors.acceptedTerms?.message ? (
                  <Text style={styles.fieldError}>
                    {errors.acceptedTerms.message}
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
                <Text style={styles.errorTitle}>
                  Não conseguimos criar sua conta
                </Text>
                <Text style={styles.errorMessage}>{errors.root.message}</Text>
              </View>
            </View>
          ) : null}

          <AnimatedPressable
            accessibilityLabel="Criar conta"
            accessibilityRole="button"
            accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
            disabled={isSubmitting}
            onPress={() => void handleSubmit(submit)()}
            style={styles.primaryButton}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#07110E" size="small" />
            ) : (
              <Text style={styles.primaryLabel}>Criar minha conta</Text>
            )}
          </AnimatedPressable>
        </FadeInView>

        <FadeInView delay={160} style={styles.signInRow}>
          <Text style={styles.signInPrompt}>Já possui uma conta?</Text>
          <AnimatedPressable
            accessibilityRole="link"
            onPress={() => router.replace('/sign-in')}
            style={styles.signInButton}
          >
            <Text style={styles.signInLink}>Entrar</Text>
          </AnimatedPressable>
        </FadeInView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: palette.background, flex: 1 },
  screen: { paddingBottom: 24, paddingHorizontal: 20, paddingTop: 12 },
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
  heading: { gap: 10, paddingTop: 10 },
  title: {
    color: palette.text,
    fontFamily: 'Manrope_700Bold',
    fontSize: 32,
    letterSpacing: -1.15,
    lineHeight: 38,
    maxWidth: 350,
  },
  subtitle: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 350,
  },
  form: { gap: 18 },
  fieldBlock: { gap: 7 },
  label: {
    color: palette.textSecondary,
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    overflow: 'hidden',
    paddingLeft: 15,
  },
  inputShellError: { borderColor: palette.danger },
  inputIcon: { alignItems: 'center', justifyContent: 'center', width: 24 },
  input: {
    color: palette.text,
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: 12,
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
  requirements: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  requirementsTitle: {
    color: palette.textMuted,
    fontFamily: 'Manrope_700Bold',
    fontSize: 9,
    letterSpacing: 1.25,
    lineHeight: 13,
  },
  requirementsGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 9 },
  requirement: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    width: '50%',
  },
  requirementMark: {
    alignItems: 'center',
    backgroundColor: palette.surfacePressed,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  requirementMarkMet: { backgroundColor: palette.primary },
  requirementText: {
    color: palette.textMuted,
    flexShrink: 1,
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    lineHeight: 15,
  },
  requirementTextMet: { color: palette.primary },
  termsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.borderStrong,
    borderRadius: 7,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  termsText: {
    color: palette.textSecondary,
    flex: 1,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  termsLink: { color: palette.text, fontFamily: 'Manrope_600SemiBold' },
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
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  signInRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingTop: 2,
  },
  signInPrompt: {
    color: palette.textMuted,
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  signInButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 2,
  },
  signInLink: {
    color: palette.primary,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    lineHeight: 19,
  },
});
