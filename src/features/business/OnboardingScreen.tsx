import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import { Keyboard, StyleSheet, View } from 'react-native';

import { StepTransition } from '@/components/motion';
import {
  Button,
  Card,
  ConfirmationDialog,
  InlineFeedback,
  Screen,
  Text,
} from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';
import { normalizeError } from '@/lib/errors';
import { useAuth } from '@/providers/AuthProvider';
import { radii, spacing, useTheme } from '@/theme';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
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
    formState: { errors, isDirty },
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
  const discard = useUnsavedChangesGuard(isDirty);
  const mutation = useMutation({
    mutationFn: (data: BusinessFormData) => {
      if (!user) throw new Error('Missing user');
      return completeOnboarding(user.id, data);
    },
    onSuccess: async () => {
      discard.allowNextNavigation();
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
  const editSection = (target: number) => {
    setDirection(target < step ? 'back' : 'forward');
    setStep(target);
  };

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
          <View style={styles.review}>
            <ReviewSection
              onEdit={() => editSection(0)}
              rows={[
                ['Nome do negócio', values.businessName],
                ['Tipo de documento', values.documentType?.toUpperCase()],
                [
                  values.documentType?.toUpperCase() || 'Documento',
                  values.documentNumber,
                ],
              ]}
              title="Negócio"
            />
            <ReviewSection
              onEdit={() => editSection(1)}
              rows={[
                ['Telefone profissional', values.professionalPhone],
                ['E-mail profissional', values.email],
              ]}
              title="Contato"
            />
            <ReviewSection
              onEdit={() => editSection(2)}
              rows={[
                ['Rua', values.street],
                ['Número', values.number],
                ['Complemento', values.complement || 'Não informado'],
                ['Bairro', values.neighborhood],
                ['Cidade', values.city],
                ['Estado', values.state],
                ['CEP', values.postalCode],
              ]}
              title="Endereço"
            />
            <ReviewSection
              onEdit={() => editSection(3)}
              rows={[['Chave Pix', values.pixKey || 'Não informada']]}
              title="Pagamento"
            />
            <Card variant="highlighted">
              <Text color="textSecondary" variant="bodySmall">
                O perfil será salvo somente quando você tocar em “Concluir
                perfil”.
              </Text>
            </Card>
          </View>
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
      <ConfirmationDialog
        cancelLabel="Continuar preenchendo"
        confirmLabel="Descartar alterações"
        description="Os dados deste perfil ainda não foram salvos."
        destructive
        onCancel={discard.cancelDiscard}
        onConfirm={discard.confirmDiscard}
        title="Sair do cadastro?"
        visible={discard.visible}
      />
    </Screen>
  );
}

function ReviewSection({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: readonly (readonly [string, string | undefined])[];
  onEdit: () => void;
}) {
  return (
    <Card
      headerTrailing={
        <Button
          label={`Editar ${title}`}
          onPress={onEdit}
          size="small"
          variant="ghost"
        />
      }
      title={title}
    >
      <View style={styles.reviewRows}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.reviewRow}>
            <Text color="textMuted" variant="caption">
              {label}
            </Text>
            <Text selectable variant="bodyMedium">
              {value || 'Não informado'}
            </Text>
          </View>
        ))}
      </View>
    </Card>
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
  review: { gap: spacing.md },
  reviewRows: { gap: spacing.md },
  reviewRow: { gap: spacing.xs },
});
