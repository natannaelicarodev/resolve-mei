import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { Button, Checkbox, Input, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { colors } from '@/theme';
import { signUp } from './api';
import { AuthShell } from './AuthShell';
import { signUpSchema } from './schemas';
import type { SignUpData } from './schemas';

export function SignUpScreen() {
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
    <AuthShell
      title="Criar conta"
      subtitle="Comece sua configuração profissional"
    >
      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <Input
            autoCapitalize="words"
            error={errors.fullName?.message}
            label="Nome completo"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            value={field.value}
          />
        )}
      />
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
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            accessibilityHint="Mínimo de 8 caracteres, com maiúscula, minúscula e número"
            error={errors.password?.message}
            label="Senha"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <Input
            error={errors.confirmPassword?.message}
            label="Confirmar senha"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
            value={field.value}
          />
        )}
      />
      <Controller
        control={control}
        name="acceptedTerms"
        render={({ field }) => (
          <Checkbox
            checked={field.value}
            error={errors.acceptedTerms?.message}
            label="Li e aceito os termos de uso"
            onChange={field.onChange}
          />
        )}
      />
      {errors.root?.message ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errors.root.message}
        </Text>
      ) : null}
      <Button
        label="Criar conta"
        loading={isSubmitting}
        onPress={() => void handleSubmit(submit)()}
      />
      <Text>
        Já possui conta?{' '}
        <Link href="/sign-in" style={styles.link}>
          Entrar
        </Link>
      </Text>
    </AuthShell>
  );
}
const styles = StyleSheet.create({
  error: { color: colors.danger },
  link: { color: colors.primary },
});
