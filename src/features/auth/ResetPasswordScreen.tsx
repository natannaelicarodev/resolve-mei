import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useState } from 'react';

import {
  Button,
  Icon,
  IconButton,
  InlineFeedback,
  Input,
} from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { updatePassword } from './api';
import { AuthShell } from './AuthShell';
import { resetPasswordSchema } from './schemas';
import type { ResetPasswordData } from './schemas';
import { PasswordRequirements } from './PasswordRequirements';

export function ResetPasswordScreen() {
  const { session, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const password = useWatch({ control, name: 'password' });
  const submit = async (data: ResetPasswordData) => {
    try {
      await updatePassword(data.password);
      clearPasswordRecovery();
      router.replace('/home');
    } catch (error) {
      setError('root', { message: normalizeError(error).message });
    }
  };
  if (!session || !isPasswordRecovery)
    return (
      <AuthShell
        heroSubtitle="Links de recuperação são temporários para manter seus dados seguros."
        heroTitle="Seu acesso continua protegido."
        subtitle="Solicite um novo acesso para continuar."
        title="Link expirado"
      >
        <InlineFeedback
          message="Este link expirou, já foi utilizado ou não pertence a uma recuperação de senha."
          variant="warning"
        />
        <Button
          label="Solicitar novo link"
          onPress={() => router.replace('/forgot-password')}
        />
        <Button
          label="Voltar para entrar"
          onPress={() => router.replace('/sign-in')}
          variant="ghost"
        />
      </AuthShell>
    );
  return (
    <AuthShell
      heroSubtitle="Escolha uma combinação segura e diferente das senhas que você já utilizou."
      heroTitle="Proteja o acesso ao seu negócio."
      subtitle="Crie uma combinação segura para voltar à sua conta."
      title="Crie uma nova senha"
    >
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            error={errors.password?.message}
            label="Nova senha"
            autoComplete="new-password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            returnKeyType="next"
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
            label="Confirmar nova senha"
            autoComplete="new-password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            returnKeyType="done"
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
      {errors.root?.message ? (
        <InlineFeedback message={errors.root.message} variant="error" />
      ) : null}
      <Button
        label="Atualizar senha"
        loading={isSubmitting}
        onPress={() => void handleSubmit(submit)()}
      />
    </AuthShell>
  );
}
