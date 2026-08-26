import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button, InlineFeedback, Input, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { updatePassword } from './api';
import { AuthShell } from './AuthShell';
import { resetPasswordSchema } from './schemas';
import type { ResetPasswordData } from './schemas';
import { PasswordRequirements } from './PasswordRequirements';

export function ResetPasswordScreen() {
  const { session, isPasswordRecovery, clearPasswordRecovery } = useAuth();
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
      <AuthShell title="Link inválido" subtitle="Solicite uma nova recuperação">
        <Text>Este link expirou ou já foi utilizado.</Text>
        <Button
          label="Solicitar novo link"
          onPress={() => router.replace('/forgot-password')}
        />
      </AuthShell>
    );
  return (
    <AuthShell title="Definir nova senha" subtitle="Escolha uma senha forte">
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <Input
            error={errors.password?.message}
            label="Nova senha"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
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
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            secureTextEntry
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
