import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { SuccessTransition } from '@/components/motion';
import { InlineFeedback, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { lightColors, spacing } from '@/theme';
import { requestPasswordReset } from './api';
import {
  AuthField,
  AuthFieldGroup,
  AuthErrorFeedback,
  AuthHeading,
  AuthPrimaryButton,
  AuthScreen,
} from './AuthVisual';
import { forgotPasswordSchema } from './schemas';
import type { ForgotPasswordData } from './schemas';

export function ForgotPasswordScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });
  const submit = async (data: ForgotPasswordData) => {
    try {
      await requestPasswordReset(data.email);
    } catch (error) {
      setError('root', { message: normalizeError(error).message });
    }
  };
  return (
    <AuthScreen contentContainerStyle={styles.screen}>
      <AuthHeading title="Recupere seu acesso">
        <Text style={styles.subtitle}>
          Informe seu e-mail e enviaremos as instruções.
        </Text>
      </AuthHeading>
      <View style={styles.form}>
        <AuthFieldGroup>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <AuthField
                autoCapitalize="none"
                icon="email-outline"
                keyboardType="email-address"
                label="E-mail"
                last
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                value={field.value}
              />
            )}
          />
        </AuthFieldGroup>
        {errors.email?.message ? (
          <InlineFeedback message={errors.email.message} variant="error" />
        ) : null}
        {errors.root?.message ? (
          <AuthErrorFeedback
            message={errors.root.message}
            title="Não foi possível enviar as instruções"
          />
        ) : null}
        {isSubmitSuccessful ? (
          <SuccessTransition message="Se o e-mail estiver cadastrado, enviaremos as instruções." />
        ) : null}
        <AuthPrimaryButton
          label="Enviar instruções"
          loading={isSubmitting}
          onPress={() => void handleSubmit(submit)()}
        />
        <Link href="/sign-in" style={styles.link}>
          Voltar para entrar
        </Link>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.xl, paddingTop: 255 },
  subtitle: { color: lightColors.textSecondary },
  form: { gap: spacing.lg },
  link: { color: lightColors.primary, fontWeight: '700' },
});
