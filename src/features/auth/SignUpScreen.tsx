import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import { Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { darkColors, radii, spacing, typography } from '@/theme';
import { signUp } from './api';
import { passwordRequirementChecks } from './PasswordRequirements';
import { signUpSchema } from './schemas';
import type { SignUpData } from './schemas';
import { WelcomeAmbientBackground } from './WelcomeScreen';

function SignUpField({
  error,
  label,
  rightAccessory,
  ...props
}: TextInputProps & {
  error?: string;
  label: string;
  rightAccessory?: ReactNode;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, error && styles.inputShellError]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#858A90"
          selectionColor="#2DD4BF"
          style={styles.input}
          {...props}
        />
        {rightAccessory}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
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
  return (
    <AnimatedPressable
      accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'}
      accessibilityRole="button"
      hitSlop={4}
      onPress={onPress}
      style={styles.eyeButton}
    >
      <MaterialCommunityIcons
        color="#858A90"
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={22}
      />
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
      router.replace(
        session
          ? '/onboarding'
          : { pathname: '/confirm-email', params: { email: data.email } },
      );
    } catch (error) {
      setError('root', { message: normalizeError(error).message });
    }
  };

  return (
    <View style={styles.root}>
      <WelcomeAmbientBackground dark />
      <Screen
        background="transparent"
        contentContainerStyle={styles.screen}
        keyboardAvoiding
      >
        <FadeInView style={styles.card}>
          <View style={styles.heading}>
            <Text style={styles.title}>Criar sua conta</Text>
            <Text style={styles.subtitle}>
              Leva menos de um minuto para começar.
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="fullName"
              render={({ field }) => (
                <SignUpField
                  autoCapitalize="words"
                  error={errors.fullName?.message}
                  label="Nome completo"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Como você se chama"
                  returnKeyType="next"
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
                  keyboardType="email-address"
                  label="E-mail"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="seuemail@exemplo.com"
                  returnKeyType="next"
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
                  error={errors.password?.message}
                  label="Senha"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Crie uma senha"
                  rightAccessory={
                    <PasswordEye
                      onPress={() => setShowPassword((current) => !current)}
                      visible={showPassword}
                    />
                  }
                  secureTextEntry={!showPassword}
                  value={field.value}
                />
              )}
            />

            <View
              accessibilityLabel="Requisitos da senha"
              style={styles.requirements}
            >
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
                        styles.requirementDot,
                        met && styles.requirementDotMet,
                      ]}
                    />
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

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <SignUpField
                  error={errors.confirmPassword?.message}
                  label="Confirmar senha"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder="Repita sua senha"
                  returnKeyType="done"
                  rightAccessory={
                    <PasswordEye
                      onPress={() => setShowConfirmation((current) => !current)}
                      visible={showConfirmation}
                    />
                  }
                  secureTextEntry={!showConfirmation}
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
                    onPress={() => field.onChange(!field.value)}
                    style={styles.termsRow}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        field.value && styles.checkboxChecked,
                      ]}
                    >
                      {field.value ? (
                        <MaterialCommunityIcons
                          color="#101416"
                          name="check"
                          size={16}
                        />
                      ) : null}
                    </View>
                    <Text style={styles.termsText}>
                      Li e aceito os termos de uso
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
                <MaterialCommunityIcons
                  color={darkColors.danger}
                  name="alert-circle-outline"
                  size={20}
                />
                <View style={styles.errorCopy}>
                  <Text style={styles.errorTitle}>
                    Não foi possível criar sua conta
                  </Text>
                  <Text style={styles.errorMessage}>{errors.root.message}</Text>
                </View>
              </View>
            ) : null}

            <AnimatedPressable
              accessibilityLabel="Criar conta"
              accessibilityRole="button"
              accessibilityState={{
                busy: isSubmitting,
                disabled: isSubmitting,
              }}
              disabled={isSubmitting}
              onPress={() => void handleSubmit(submit)()}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryLabel}>
                {isSubmitting ? 'Aguarde...' : 'Criar conta'}
              </Text>
            </AnimatedPressable>
          </View>

          <View style={styles.signInRow}>
            <Text style={styles.signInPrompt}>Já tem conta?</Text>
            <Link href="/sign-in" style={styles.signInLink}>
              Entrar
            </Link>
          </View>
        </FadeInView>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#14161A', flex: 1 },
  screen: { justifyContent: 'center', padding: spacing.sm },
  card: {
    backgroundColor: '#14161A',
    borderColor: '#20242A',
    borderRadius: 28,
    borderWidth: 1,
    gap: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    width: '100%',
  },
  heading: { gap: spacing.xs },
  title: {
    color: '#F2F2F0',
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: { color: '#B2B5BA', fontSize: 14, lineHeight: 22 },
  form: { gap: spacing.md },
  fieldBlock: { gap: spacing.xs },
  label: {
    color: '#D4D6D9',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  inputShell: {
    alignItems: 'center',
    backgroundColor: '#1F2227',
    borderColor: '#343941',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    overflow: 'hidden',
    paddingLeft: spacing.md,
  },
  inputShellError: { borderColor: darkColors.danger },
  input: {
    color: '#F2F2F0',
    flex: 1,
    minHeight: 54,
    paddingRight: spacing.md,
    paddingVertical: 0,
    ...typography.body,
  },
  eyeButton: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  fieldError: { color: darkColors.danger, fontSize: 12, lineHeight: 17 },
  requirements: {
    backgroundColor: '#1F2227',
    borderColor: '#343941',
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  requirement: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  requirementDot: {
    backgroundColor: '#858A90',
    borderRadius: 1,
    height: 7,
    width: 7,
  },
  requirementDotMet: {
    backgroundColor: '#31E39A',
    boxShadow: '0 0 7px rgba(49, 227, 154, 0.75)',
  },
  requirementText: {
    color: '#858A90',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  requirementTextMet: { color: '#31E39A' },
  termsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 48,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#858A90',
    borderRadius: radii.small,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: { backgroundColor: '#2DD4BF', borderColor: '#2DD4BF' },
  termsText: { color: '#B2B5BA', fontSize: 13, lineHeight: 19 },
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#301B1A',
    borderColor: '#69322E',
    borderRadius: radii.medium,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    padding: spacing.sm,
  },
  errorCopy: { flex: 1, gap: 2 },
  errorTitle: {
    color: darkColors.danger,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  errorMessage: { color: '#E0B7B3', fontSize: 12, lineHeight: 17 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2DD4BF',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 60,
  },
  primaryLabel: {
    color: '#101416',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  signInRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    justifyContent: 'center',
  },
  signInPrompt: { color: '#868B91', fontSize: 15, lineHeight: 22 },
  signInLink: {
    color: '#2DD4BF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 22,
    paddingVertical: spacing.xs,
  },
});
