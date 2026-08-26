import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';

import { LoadingScreen } from '@/components/LoadingScreen';
import { Button, Card, Input, Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/theme';
import { getMyProfile, updateMyProfile } from './api';
import { scheduleProfileRedirect } from './navigation';
import { ProfessionalProfileForm } from './ProfessionalProfileForm';
import { profileSchema } from './schemas';
import type { ProfileFormData } from './schemas';

export const profileQueryKey = ['profile', 'mine'] as const;

export function ProfileScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cancelNavigation = useRef<(() => void) | null>(null);
  const submissionLocked = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const query = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => getMyProfile(user?.id ?? ''),
    enabled: Boolean(user),
  });
  const {
    control,
    handleSubmit,
    reset,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', phone: '' },
  });
  useEffect(() => {
    if (query.data)
      reset({ fullName: query.data.full_name, phone: query.data.phone ?? '' });
  }, [query.data, reset]);
  useEffect(
    () => () => {
      cancelNavigation.current?.();
    },
    [],
  );
  const mutation = useMutation({
    mutationFn: (data: ProfileFormData) =>
      updateMyProfile(user?.id ?? '', data),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile);
      void queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setShowSuccess(true);
      cancelNavigation.current?.();
      cancelNavigation.current = scheduleProfileRedirect(() => {
        router.replace('/home');
      });
    },
    onError: (error) => {
      submissionLocked.current = false;
      setError('root', { message: normalizeError(error).message });
    },
  });
  const submit = (data: ProfileFormData) => {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    clearErrors('root');
    setShowSuccess(false);
    mutation.mutate(data);
  };
  if (query.isLoading) return <LoadingScreen label="Carregando perfil..." />;
  return (
    <Screen>
      <Text variant="title">Dados pessoais</Text>
      <Card>
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
          name="phone"
          render={({ field }) => (
            <Input
              error={errors.phone?.message}
              keyboardType="phone-pad"
              label="Telefone pessoal"
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
        {showSuccess ? (
          <Text
            accessible
            accessibilityLiveRegion="polite"
            style={styles.success}
          >
            Dados pessoais atualizados com sucesso.
          </Text>
        ) : null}
        <Button
          disabled={mutation.isPending || showSuccess}
          label="Salvar dados pessoais"
          loading={mutation.isPending}
          onPress={() => void handleSubmit(submit)()}
        />
      </Card>
      <ProfessionalProfileForm />
    </Screen>
  );
}
const styles = StyleSheet.create({
  error: { color: colors.danger },
  success: { color: colors.primary },
});
