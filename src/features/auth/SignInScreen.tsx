import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import {
  Button,
  Icon,
  IconButton,
  InlineFeedback,
  Input,
  Text,
} from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { spacing, useTheme } from '@/theme';
import { signIn } from './api';
import { AuthShell } from './AuthShell';
import { signInSchema } from './schemas';
import type { SignInData } from './schemas';

export function SignInScreen() {
  const { colors } = useTheme();
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
    <AuthShell
      heroSubtitle="Clientes, serviços e orçamentos organizados em um só lugar."
      heroTitle="Seu negócio, sob controle."
      subtitle="Entre para continuar cuidando do seu negócio."
      title="Bem-vindo de volta"
    >
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
            returnKeyType="next"
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
            returnKeyType="done"
            secureTextEntry={!showPassword}
            trailing={
              <IconButton
                accessibilityLabel={
                  showPassword ? 'Ocultar senha' : 'Mostrar senha'
                }
                icon={
                  <Icon
                    color="textSecondary"
                    name={showPassword ? 'hide' : 'preview'}
                    size="medium"
                  />
                }
                onPress={() => setShowPassword((current) => !current)}
              />
            }
            value={field.value}
          />
        )}
      />
      {errors.root?.message ? (
        <InlineFeedback message={errors.root.message} variant="error" />
      ) : null}
      <Link
        accessibilityRole="link"
        href="/forgot-password"
        style={[styles.forgotLink, { color: colors.primary }]}
      >
        Esqueci minha senha
      </Link>
      <Button
        label="Entrar"
        loading={isSubmitting}
        onPress={() => void handleSubmit(submit)()}
      />
      <Text color="textSecondary" style={styles.accountAction}>
        Ainda não tem uma conta?{' '}
        <Link
          accessibilityRole="link"
          href="/sign-up"
          style={[styles.link, { color: colors.primary }]}
        >
          Criar conta
        </Link>
      </Text>
    </AuthShell>
  );
}
const styles = StyleSheet.create({
  accountAction: { alignSelf: 'center', textAlign: 'center' },
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -(spacing.sm + spacing.xs),
    paddingVertical: spacing.xs,
  },
  link: { paddingVertical: spacing.sm },
});
