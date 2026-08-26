import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';
import { completeOnboarding } from './api';
import { BusinessFormFields } from './BusinessFormFields';
import { businessQueryKey } from './hooks';
import { businessSchema } from './schemas';
import type { BusinessFormData } from './schemas';

export function OnboardingScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [logo, setLogo] = useState<ImagePickerAsset>();
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
    defaultValues: {
      businessName: '',
      documentType: 'cpf',
      documentNumber: '',
      professionalPhone: '',
      email: user?.email ?? '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'SP',
      postalCode: '',
      pixKey: '',
    },
  });
  const mutation = useMutation({
    mutationFn: (data: BusinessFormData) => {
      if (!user) throw new Error('Missing user');
      return completeOnboarding(user.id, data, logo);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: businessQueryKey });
    },
    onError: (error) => {
      setError('root', { message: normalizeError(error).message });
    },
  });

  return (
    <Screen>
      <View style={styles.intro}>
        <Text variant="title">Seu perfil profissional</Text>
        <Text style={styles.muted}>
          Informe os dados exibidos futuramente nos seus documentos.
        </Text>
      </View>
      <BusinessFormFields
        control={control}
        disabled={mutation.isPending}
        onLogoSelected={setLogo}
        selectedLogo={logo}
        setValue={setValue}
      />
      {errors.root?.message ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {errors.root.message}
        </Text>
      ) : null}
      <Button
        label="Concluir configuração"
        loading={mutation.isPending}
        onPress={() => void handleSubmit((data) => mutation.mutate(data))()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs },
  muted: { color: colors.textMuted },
  error: { color: colors.danger },
});
