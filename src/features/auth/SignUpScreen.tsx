import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { AnimatedPressable, FadeInView } from '@/components/motion';
import { Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { darkColors, radii, spacing } from '@/theme';
import { signUp } from './api';
import {
  AuthField,
  AuthFieldGroup,
  AuthErrorFeedback,
  AuthHeading,
  AuthPrimaryButton,
  AuthScreen,
  PasswordEye,
} from './AuthVisual';
import { passwordRequirementChecks } from './PasswordRequirements';
import { signUpSchema } from './schemas';
import type { SignUpData } from './schemas';

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
    <AuthScreen contentContainerStyle={styles.screen}>
      <View style={styles.content}>
        <AuthHeading title="Crie sua conta">
          <Text style={styles.lightText} variant="caption">
            Já possui uma conta?
          </Text>
          <Link href="/sign-in" style={styles.link}>
            Entrar
          </Link>
        </AuthHeading>
        <FadeInView delay={100} style={styles.form}>
          <AuthFieldGroup>
            <Controller
              control={control}
              name="fullName"
              render={({ field }) => (
                <AuthField
                  autoCapitalize="words"
                  icon="account-outline"
                  label="Nome completo"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  returnKeyType="next"
                  value={field.value}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <AuthField
                  autoCapitalize="none"
                  autoComplete="email"
                  icon="email-outline"
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
                <AuthField
                  accessibilityHint="Mínimo de 8 caracteres, com maiúscula, minúscula e número"
                  icon="lock-outline"
                  label="Senha"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
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
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <AuthField
                  icon="lock-check-outline"
                  label="Confirmar senha"
                  last
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
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
          </AuthFieldGroup>
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
                  <MaterialCommunityIcons
                    color={met ? darkColors.success : darkColors.textMuted}
                    name={met ? 'check-circle-outline' : 'circle-outline'}
                    size={14}
                  />
                  <Text
                    color={met ? 'success' : 'textMuted'}
                    style={styles.requirementText}
                    variant="caption"
                  >
                    {requirement.label}
                  </Text>
                </View>
              );
            })}
          </View>
          {errors.fullName?.message ? (
            <Text color="danger" variant="caption">
              {errors.fullName.message}
            </Text>
          ) : null}
          {errors.email?.message ? (
            <Text color="danger" variant="caption">
              {errors.email.message}
            </Text>
          ) : null}
          {errors.password?.message ? (
            <Text color="danger" variant="caption">
              {errors.password.message}
            </Text>
          ) : null}
          {errors.confirmPassword?.message ? (
            <Text color="danger" variant="caption">
              {errors.confirmPassword.message}
            </Text>
          ) : null}
          <Controller
            control={control}
            name="acceptedTerms"
            render={({ field }) => (
              <View>
                <AnimatedPressable
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
                        color={darkColors.textOnPrimary}
                        name="check"
                        size={16}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.lightText} variant="caption">
                    Li e aceito os termos de uso
                  </Text>
                </AnimatedPressable>
                {errors.acceptedTerms?.message ? (
                  <Text color="danger" variant="caption">
                    {errors.acceptedTerms.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
          {errors.root?.message ? (
            <AuthErrorFeedback
              message={errors.root.message}
              title="Não foi possível criar sua conta"
            />
          ) : null}
          <AuthPrimaryButton
            label="Criar conta"
            loading={isSubmitting}
            onPress={() => void handleSubmit(submit)()}
          />
        </FadeInView>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: 325,
  },
  content: { gap: spacing.lg, width: '100%' },
  form: { gap: spacing.sm },
  link: {
    color: darkColors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    paddingVertical: spacing.xs,
  },
  requirements: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  requirement: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    width: '48%',
  },
  requirementText: {
    color: darkColors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  termsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 44,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: darkColors.borderStrong,
    borderRadius: radii.small,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxChecked: {
    backgroundColor: darkColors.primary,
    borderColor: darkColors.primary,
  },
  lightText: { color: '#6B6880' },
});
