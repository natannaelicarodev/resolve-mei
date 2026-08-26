import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { Button, Input, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { colors } from '@/theme';
import { requestPasswordReset } from './api';
import { AuthShell } from './AuthShell';
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
    <AuthShell
      title="Recuperar senha"
      subtitle="Receba um link seguro por e-mail"
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
        <Text accessibilityRole="alert" style={styles.error}>
          {errors.root.message}
        </Text>
      ) : null}
      {isSubmitSuccessful ? (
        <Text accessibilityLiveRegion="polite">
          Se o e-mail estiver cadastrado, enviaremos as instruções.
        </Text>
      ) : null}
      <Button
        label="Enviar instruções"
        loading={isSubmitting}
        onPress={() => void handleSubmit(submit)()}
      />
      <Link href="/sign-in" style={styles.link}>
        Voltar para entrar
      </Link>
    </AuthShell>
  );
}
const styles = StyleSheet.create({
  error: { color: colors.danger },
  link: { color: colors.primary },
});
