import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { FieldPath } from 'react-hook-form';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AnimatedPressable, StepTransition } from '@/components/motion';
import {
  Button,
  Card,
  ConfirmationDialog,
  Icon,
  InlineFeedback,
  Screen,
  Text,
} from '@/components/ui';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { normalizeError } from '@/lib/errors';
import { triggerHaptic } from '@/lib/haptics';
import { useAuth } from '@/providers/AuthProvider';
import { getThemeShadows, radii, spacing, useTheme } from '@/theme';
import { completeOnboarding } from './api';
import { BusinessFormFields } from './BusinessFormFields';
import type { BusinessFormSection } from './BusinessFormFields';
import { businessQueryKey } from './hooks';
import { businessSchema } from './schemas';
import type { BusinessFormData, OnboardingPriority } from './schemas';

interface OnboardingStep {
  title: string;
  description: string;
  section?: BusinessFormSection;
  fields: readonly FieldPath<BusinessFormData>[];
}

const steps: readonly [OnboardingStep, ...OnboardingStep[]] = [
  {
    title: 'O que você quer organizar primeiro?',
    description:
      'Vamos destacar o melhor primeiro passo quando seu perfil estiver pronto.',
    fields: [],
  },
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
    description: 'Comece pelo CEP e complete apenas o que faltar.',
    section: 'address',
    fields: ['postalCode', 'street', 'number', 'neighborhood', 'city', 'state'],
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

const priorityOptions: readonly {
  value: OnboardingPriority;
  title: string;
  description: string;
  icon: 'quote' | 'money' | 'date' | 'trendUp';
}[] = [
  {
    value: 'quotes',
    title: 'Criar orçamentos com mais agilidade',
    description: 'Montar, enviar e acompanhar propostas.',
    icon: 'quote',
  },
  {
    value: 'collections',
    title: 'Acompanhar cobranças e recebimentos',
    description: 'Saber o que já entrou e o que ainda falta.',
    icon: 'money',
  },
  {
    value: 'agenda',
    title: 'Organizar minha agenda de serviços',
    description: 'Manter compromissos e prazos em dia.',
    icon: 'date',
  },
  {
    value: 'profit',
    title: 'Entender melhor meus custos e lucro',
    description: 'Acompanhar despesas e o resultado do negócio.',
    icon: 'trendUp',
  },
] as const;

export function OnboardingScreen() {
  const { colors, resolvedTheme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [priority, setPriority] = useState<OnboardingPriority>();
  const [priorityError, setPriorityError] = useState(false);
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
  const discard = useUnsavedChangesGuard(isDirty || Boolean(priority));
  const mutation = useMutation({
    mutationFn: (data: BusinessFormData) => {
      if (!user) throw new Error('Missing user');
      if (!priority) throw new Error('Missing onboarding priority');
      return completeOnboarding(user.id, data, priority);
    },
    onSuccess: async (saved) => {
      discard.allowNextNavigation();
      void triggerHaptic('success');
      if (user) {
        queryClient.setQueryData(businessQueryKey(user.id), saved);
        await queryClient.invalidateQueries({
          queryKey: businessQueryKey(user.id),
        });
      }
    },
    onError: (error) =>
      setError('root', { message: normalizeError(error).message }),
  });
  const current = steps[step] ?? steps[0];
  const values = useWatch({ control });

  const goNext = async () => {
    if (step === 0 && !priority) {
      setPriorityError(true);
      return;
    }
    if (!(await trigger(current.fields, { shouldFocus: true }))) return;
    Keyboard.dismiss();
    setDirection('forward');
    setStep((value) => Math.min(value + 1, steps.length - 1));
  };
  const goBack = () => {
    Keyboard.dismiss();
    setDirection('back');
    setStep((value) => Math.max(0, value - 1));
  };
  const editSection = (target: number) => {
    setDirection(target < step ? 'back' : 'forward');
    setStep(target);
  };

  if (mutation.isPending) {
    const shadows = getThemeShadows(resolvedTheme);
    return (
      <Screen
        background="subtle"
        contentContainerStyle={[
          styles.preparingScreen,
          { backgroundColor: colors.backgroundSubtle },
        ]}
        safeAreaColor={colors.primary}
        safeAreaEdges={['top', 'bottom']}
        scroll={false}
      >
        <StatusBar style="light" />
        <View
          style={[
            styles.preparingBand,
            { backgroundColor: colors.primary, width: windowWidth + 4 },
          ]}
        />
        <Card style={[styles.preparingCard, shadows.raised]}>
          <View
            accessibilityLabel="Preparando seu espaço"
            accessibilityState={{ busy: true }}
            style={styles.preparingContent}
          >
            <View
              style={[
                styles.preparingIndicator,
                { backgroundColor: colors.primarySubtle },
              ]}
            >
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
            <Text style={styles.centerText} variant="pageTitle">
              Preparando seu espaço
            </Text>
            <Text color="textSecondary" style={styles.centerText}>
              Estamos organizando tudo para o seu primeiro passo.
            </Text>
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      background="subtle"
      contentContainerStyle={[
        styles.screenContent,
        { backgroundColor: colors.backgroundSubtle },
      ]}
      keyboardAvoiding
      safeAreaColor={colors.primary}
      safeAreaEdges={['top', 'bottom']}
      style={{ backgroundColor: colors.primary }}
    >
      <StatusBar style="light" />
      <View
        style={[
          styles.identityBand,
          { backgroundColor: colors.primary, width: windowWidth + 4 },
        ]}
      >
        <View style={styles.progressHeader}>
          <Text
            style={{ color: colors.textInverse }}
            variant="label"
          >{`Etapa ${step + 1} de ${steps.length}`}</Text>
          <Text
            style={{ color: colors.textInverse }}
            variant="caption"
          >{`${Math.round(((step + 1) / steps.length) * 100)}%`}</Text>
        </View>
        <View
          accessibilityLabel={`${Math.round(((step + 1) / steps.length) * 100)}% concluído`}
          accessibilityRole="progressbar"
          style={[
            styles.progressTrack,
            { backgroundColor: colors.primaryPressed },
          ]}
        >
          <View
            style={[
              styles.progress,
              {
                backgroundColor: colors.textInverse,
                width: `${((step + 1) / steps.length) * 100}%`,
              },
            ]}
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={{ color: colors.textInverse }} variant="pageTitle">
            {current.title}
          </Text>
          <Text style={{ color: colors.textInverse }} variant="bodySmall">
            {current.description}
          </Text>
        </View>
      </View>

      <View style={styles.stepBody}>
        <StepTransition direction={direction} step={step}>
          {step === 0 ? (
            <View style={styles.priorityList}>
              {priorityOptions.map((option) => {
                const selected = option.value === priority;
                return (
                  <AnimatedPressable
                    key={option.value}
                    accessibilityLabel={option.title}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    haptic="selection"
                    onPress={() => {
                      setPriority(option.value);
                      setPriorityError(false);
                    }}
                    style={styles.priorityPressable}
                  >
                    <Card
                      style={styles.priorityCard}
                      trailing={
                        selected ? (
                          <Icon color="primary" name="success" size="medium" />
                        ) : null
                      }
                      variant={selected ? 'selected' : 'interactive'}
                    >
                      <View style={styles.priorityRow}>
                        <View
                          style={[
                            styles.priorityIcon,
                            { backgroundColor: colors.primarySubtle },
                          ]}
                        >
                          <Icon color="primary" name={option.icon} />
                        </View>
                        <View style={styles.priorityCopy}>
                          <Text variant="bodyMedium">{option.title}</Text>
                          <Text color="textSecondary" variant="bodySmall">
                            {option.description}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </AnimatedPressable>
                );
              })}
              {priorityError ? (
                <InlineFeedback
                  message="Escolha uma prioridade para continuar."
                  variant="error"
                />
              ) : null}
            </View>
          ) : current.section ? (
            <BusinessFormFields
              cardVariant="elevated"
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
                  [
                    'Objetivo inicial',
                    priorityOptions.find((item) => item.value === priority)
                      ?.title,
                  ],
                ]}
                title="Prioridade"
              />
              <ReviewSection
                onEdit={() => editSection(1)}
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
                onEdit={() => editSection(2)}
                rows={[
                  ['Telefone profissional', values.professionalPhone],
                  ['E-mail profissional', values.email],
                ]}
                title="Contato"
              />
              <ReviewSection
                onEdit={() => editSection(3)}
                rows={[
                  ['CEP', values.postalCode],
                  ['Rua', values.street],
                  ['Número', values.number],
                  ['Complemento', values.complement || 'Não informado'],
                  ['Bairro', values.neighborhood],
                  ['Cidade', values.city],
                  ['Estado', values.state],
                ]}
                title="Endereço"
              />
              <ReviewSection
                onEdit={() => editSection(4)}
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
      </View>

      {errors.root?.message ? (
        <InlineFeedback message={errors.root.message} variant="error" />
      ) : null}
      <View style={styles.actions}>
        {step > 0 ? (
          <Button label="Voltar" onPress={goBack} variant="ghost" />
        ) : null}
        {step < steps.length - 1 ? (
          <Button label="Continuar" onPress={() => void goNext()} />
        ) : (
          <Button
            haptic={false}
            label="Concluir perfil"
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
      variant="elevated"
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
  screenContent: { paddingHorizontal: spacing.lg },
  identityBand: {
    alignSelf: 'center',
    gap: spacing[3],
    marginTop: -spacing.md,
    paddingBottom: 56,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: { borderRadius: radii.pill, height: 6, overflow: 'hidden' },
  progress: { borderRadius: radii.pill, height: '100%' },
  headerCopy: { gap: spacing.sm, paddingTop: spacing.xs },
  stepBody: { marginTop: -40 },
  priorityList: { gap: spacing[3] },
  priorityPressable: { width: '100%' },
  priorityCard: { minHeight: 88 },
  priorityRow: { alignItems: 'center', flexDirection: 'row', gap: spacing[3] },
  priorityIcon: {
    alignItems: 'center',
    borderRadius: radii.control,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  priorityCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  actions: { gap: spacing.sm },
  review: { gap: spacing.md },
  reviewRows: { gap: spacing.md },
  reviewRow: { gap: spacing.xs },
  preparingScreen: { padding: 0 },
  preparingBand: { alignSelf: 'center', height: 180 },
  preparingCard: {
    alignSelf: 'stretch',
    marginHorizontal: spacing.lg,
    marginTop: -48,
  },
  preparingContent: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  preparingIndicator: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  centerText: { textAlign: 'center' },
});
