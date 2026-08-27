import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { Keyboard, StyleSheet, View } from 'react-native';

import { StepTransition } from '@/components/motion';
import { Button, Card, InlineFeedback, Screen, Text } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { radii, spacing, useTheme } from '@/theme';
import { completeOnboarding } from './api';
import { BusinessFormFields } from './BusinessFormFields';
import type { BusinessFormSection } from './BusinessFormFields';
import { businessQueryKey } from './hooks';
import { businessSchema } from './schemas';
import type { BusinessFormData } from './schemas';

interface OnboardingStep {
  title: string;
  description: string;
  section?: BusinessFormSection;
  fields: readonly FieldPath<BusinessFormData>[];
}

const steps: readonly [OnboardingStep, ...OnboardingStep[]] = [
  {
    title: 'Seu negócio',
    description: 'Como você se apresenta profissionalmente.',
    section: 'business',
    fields: ['businessName', 'documentType', 'documentNumber'],
  },
  {
    title: 'Contato',
    description: 'Onde seus clientes poderão falar com você.',
    section: 'contact',
    fields: ['professionalPhone', 'email'],
  },
  {
    title: 'Endereço',
    description: 'Informações usadas nos seus documentos.',
    section: 'address',
    fields: ['street', 'number', 'neighborhood', 'city', 'state', 'postalCode'],
  },
  {
    title: 'Detalhes opcionais',
    description: 'Você pode adicionar uma chave Pix agora ou depois.',
    section: 'details',
    fields: ['pixKey'],
  },
  {
    title: 'Tudo certo?',
    description: 'Revise os dados antes de concluir seu perfil.',
    fields: [],
  },
] as const;

export function OnboardingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const {
    control,
    handleSubmit,
    setError,
    setValue,
    trigger,
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
      return completeOnboarding(user.id, data);
    },
    onSuccess: async () => {
      void triggerHaptic('success');
      if (user)
        await queryClient.invalidateQueries({
          queryKey: businessQueryKey(user.id),
        });
    },
    onError: (error) =>
      setError('root', { message: normalizeError(error).message }),
  });
  const current = steps[step] ?? steps[0];
  const goNext = async () => {
    const valid = await trigger(current.fields, { shouldFocus: true });
    if (!valid) return;
    Keyboard.dismiss();
    setDirection('forward');
    setStep((value) => Math.min(value + 1, steps.length - 1));
  };
  const goBack = () => {
    setDirection('back');
    setStep((value) => Math.max(0, value - 1));
    Keyboard.dismiss();
  };
  const values = useWatch({ control });

  return (
    <Screen keyboardAvoiding safeAreaEdges={['bottom']}>
      <View style={styles.header}>
        <Text
          color="primary"
          variant="label"
        >{`Etapa ${step + 1} de ${steps.length}`}</Text>
        <View
          accessibilityLabel={`${Math.round(((step + 1) / steps.length) * 100)}% concluído`}
          accessibilityRole="progressbar"
          style={[
            styles.progressTrack,
            { backgroundColor: colors.borderSubtle },
          ]}
        >
          <View
            style={[
              styles.progress,
              { backgroundColor: colors.primary },
              { width: `${((step + 1) / steps.length) * 100}%` },
            ]}
          />
        </View>
        <Text variant="pageTitle">
          {step === 0 ? 'Vamos preparar seu perfil' : current.title}
        </Text>
        <Text color="textSecondary">{current.description}</Text>
      </View>

      <StepTransition direction={direction} step={step}>
        {current.section ? (
          <BusinessFormFields
            control={control}
            disabled={mutation.isPending}
            section={current.section}
            setValue={setValue}
          />
        ) : (
          <Card variant="highlighted">
            <Text variant="cardTitle">{values.businessName}</Text>
            <Text>{values.email}</Text>
            <Text>
              {values.city} - {values.state}
            </Text>
            <Text color="textSecondary" variant="bodySecondary">
              O perfil será salvo somente quando você tocar em “Concluir
              perfil”.
            </Text>
          </Card>
        )}
      </StepTransition>

      {errors.root?.message ? (
        <InlineFeedback message={errors.root.message} variant="error" />
      ) : null}
      <View style={styles.actions}>
        {step > 0 ? (
          <Button
            disabled={mutation.isPending}
            label="Voltar"
            onPress={goBack}
            variant="ghost"
          />
        ) : null}
        {step < steps.length - 1 ? (
          <Button label="Continuar" onPress={() => void goNext()} />
        ) : (
          <Button
            haptic={false}
            label="Concluir perfil"
            loading={mutation.isPending}
            onPress={() => void handleSubmit((data) => mutation.mutate(data))()}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  progressTrack: {
    borderRadius: radii.pill,
    height: 6,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: radii.pill,
    height: '100%',
  },
  actions: { gap: spacing.sm },
});
