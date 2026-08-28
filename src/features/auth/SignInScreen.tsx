import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';

import { FadeInView } from '@/components/motion';
import { InlineFeedback, Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { darkColors, spacing } from '@/theme';
import { signIn } from './api';
import {
  AuthBackdrop,
  AuthField,
  AuthFieldGroup,
  AuthHeading,
  AuthPrimaryButton,
  PasswordEye,
} from './AuthVisual';
import { signInSchema } from './schemas';
import type { SignInData } from './schemas';

export function SignInScreen() {
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
      <AuthBackdrop />
      <View style={styles.content}>
        <AuthHeading title="Entre na sua conta">
          <Text style={styles.lightText} variant="caption">
            Ainda não tem uma conta?
          </Text>
          <Link href="/sign-up" style={styles.link}>
            Criar conta
          </Link>
        </AuthHeading>
        <FadeInView delay={100} style={styles.form}>
          <AuthFieldGroup>
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
                  autoComplete="current-password"
                  icon="lock-outline"
                  label="Senha"
                  last
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  returnKeyType="done"
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
          </AuthFieldGroup>
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
          {errors.root?.message ? (
            <InlineFeedback message={errors.root.message} variant="error" />
          ) : null}
          <Link
            accessibilityRole="link"
            href="/forgot-password"
            style={styles.forgot}
          >
            Esqueci minha senha
          </Link>
          <AuthPrimaryButton
            label="Entrar"
            loading={isSubmitting}
            onPress={() => void handleSubmit(submit)()}
          />
        </FadeInView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: darkColors.background,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
  },
  content: { gap: spacing.xl, width: '100%' },
  form: { gap: spacing.md },
  link: {
    color: darkColors.primary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    paddingVertical: spacing.xs,
  },
  forgot: {
    alignSelf: 'center',
    color: darkColors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    paddingVertical: spacing.sm,
    textDecorationLine: 'underline',
  },
  lightText: { color: darkColors.textPrimary },
});
