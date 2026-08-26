import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { SuccessTransition } from '@/components/motion';
import { Button, InlineFeedback, Input } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { useTheme } from '@/theme';
import { requestPasswordReset } from './api';
import { AuthShell } from './AuthShell';
import { forgotPasswordSchema } from './schemas';
import type { ForgotPasswordData } from './schemas';

export function ForgotPasswordScreen() {
  const { colors } = useTheme();
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
    <AuthShell
      title="Recupere seu acesso"
      subtitle="Informe seu e-mail e enviaremos as instruções."
    >
      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <Input
            autoCapitalize="none"
            error={errors.email?.message}
            keyboardType="email-address"
            label="E-mail"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
      {errors.root?.message ? (
        <InlineFeedback message={errors.root.message} variant="error" />
      ) : null}
      {isSubmitSuccessful ? (
        <SuccessTransition message="Se o e-mail estiver cadastrado, enviaremos as instruções." />
      ) : null}
      <Button
        label="Enviar instruções"
        loading={isSubmitting}
        onPress={() => void handleSubmit(submit)()}
      />
      <Link href="/sign-in" style={[styles.link, { color: colors.primary }]}>
        Voltar para entrar
      </Link>
    </AuthShell>
  );
}
const styles = StyleSheet.create({ link: {} });
