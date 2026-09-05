import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import {
  Button,
  Checkbox,
  Icon,
  IconButton,
  InlineFeedback,
  Input,
  Text,
} from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { spacing, useTheme } from '@/theme';
import { signUp } from './api';
import { AuthShell } from './AuthShell';
import { signUpSchema } from './schemas';
import type { SignUpData } from './schemas';
import { PasswordRequirements } from './PasswordRequirements';

export function SignUpScreen() {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    <AuthShell
      heroSubtitle="Organize clientes, serviços e orçamentos desde o primeiro dia."
      heroTitle="Comece com uma rotina mais simples."
      subtitle="Comece seu perfil profissional em poucos minutos."
      title="Crie sua conta"
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
      <PasswordRequirements password={password} />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <Input
            error={errors.confirmPassword?.message}
            label="Confirmar senha"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry={!showConfirmPassword}
            trailing={
              <IconButton
                accessibilityLabel={
                  showConfirmPassword
                    ? 'Ocultar confirmação de senha'
                    : 'Mostrar confirmação de senha'
                }
                icon={
                  <Icon
                    color="textSecondary"
                    name={showConfirmPassword ? 'hide' : 'preview'}
                    size="medium"
                  />
                }
                onPress={() => setShowConfirmPassword((current) => !current)}
              />
            }
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
        <InlineFeedback message={errors.root.message} variant="error" />
      ) : null}
      <Button
        label="Criar conta"
        loading={isSubmitting}
        onPress={() => void handleSubmit(submit)()}
      />
      <Text color="textSecondary" style={styles.accountAction}>
        Já possui uma conta?{' '}
        <Link
          accessibilityRole="link"
          href="/sign-in"
          style={[styles.link, { color: colors.primary }]}
        >
          Entrar
        </Link>
      </Text>
    </AuthShell>
  );
}
const styles = StyleSheet.create({
  accountAction: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  link: { paddingVertical: spacing.sm },
});
