import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { Button, Input, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { colors, spacing } from '@/theme';
import { signIn } from './api';
import { AuthShell } from './AuthShell';
import { signInSchema } from './schemas';
import type { SignInData } from './schemas';

export function SignInScreen() {
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
    <AuthShell title="Entrar" subtitle="Acesse seu perfil profissional">
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
            secureTextEntry
            value={field.value}
          />
        )}
      />
      {errors.root?.message ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errors.root.message}
        </Text>
      ) : null}
      <Button
        label="Entrar"
        loading={isSubmitting}
        onPress={() => void handleSubmit(submit)()}
      />
      <Link href="/forgot-password" style={styles.link}>
        Esqueci minha senha
      </Link>
      <Text>
        Primeiro acesso?{' '}
        <Link href="/sign-up" style={styles.link}>
          Criar conta
        </Link>
      </Text>
    </AuthShell>
  );
}
const styles = StyleSheet.create({
  error: { color: colors.danger },
  link: { color: colors.primary, paddingVertical: spacing.sm },
});
