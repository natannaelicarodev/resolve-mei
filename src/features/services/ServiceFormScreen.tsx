import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { SuccessTransition } from '@/components/motion';
import {
  Button,
  Card,
  ConfirmationDialog,
  InlineFeedback,
  Input,
  Icon,
  Screen,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { radii, spacing, useTheme } from '@/theme';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import type { Service } from './api';
import { createService, updateService } from './api';
import { formatPriceCents, formatPriceInput } from './format';
import { servicesQueryKey } from './hooks';
import { useAuth } from '@/providers/AuthProvider';
import { emptyServiceForm, serviceSchema } from './schemas';
import type { ServiceFormData } from './schemas';

export function serviceToFormData(service: Service): ServiceFormData {
  return {
    name: service.name,
    description: service.description ?? '',
    price: formatPriceCents(service.price_cents),
    estimatedDurationMinutes:
      service.estimated_duration_minutes?.toString() ?? '',
    status: service.status,
  };
}

export function ServiceFormScreen({
  businessId,
  service,
}: {
  businessId: string;
  service?: Service;
}) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const queryClient = useQueryClient();
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submissionLocked = useRef(false);
  const [showSuccess, setShowSuccess] = useState(false);
  useEffect(
    () => () => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
    },
    [],
  );
  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service ? serviceToFormData(service) : emptyServiceForm,
  });
  const discard = useUnsavedChangesGuard(
    form.formState.isDirty && !showSuccess,
  );
  const mutation = useMutation({
    mutationFn: (input: ServiceFormData) =>
      service
        ? updateService(businessId, service.id, input)
        : createService(businessId, input),
    onSuccess: (saved) => {
      discard.allowNextNavigation();
      queryClient.setQueryData(
        [...servicesQueryKey(userId, businessId), 'detail', saved.id],
        saved,
      );
      void queryClient.invalidateQueries({
        queryKey: servicesQueryKey(userId, businessId),
      });
      setShowSuccess(true);
      navigationTimer.current = setTimeout(() => {
        router.replace({
          pathname: '/services/[id]',
          params: { id: saved.id },
        });
      }, 800);
    },
    onError: () => {
      submissionLocked.current = false;
    },
  });
  const submit = (values: ServiceFormData) => {
    if (submissionLocked.current) return;
    submissionLocked.current = true;
    mutation.mutate(values);
  };
  const detailPath = service
    ? ({ pathname: '/services/[id]', params: { id: service.id } } as const)
    : '/services';

  return (
    <Screen
      background="subtle"
      contentContainerStyle={[
        styles.content,
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
        <ProtectedPageHeader
          alwaysUseBackFallback
          back
          backFallback={detailPath}
          dismissToBackFallback
          foregroundColor={colors.textInverse}
          title={service ? 'Editar serviço' : 'Novo serviço'}
        />
        <View style={styles.intro}>
          <View
            style={[styles.introIcon, { backgroundColor: colors.textInverse }]}
          >
            <Icon
              name={service ? 'edit' : 'service'}
              rawColor={colors.primary}
              size="large"
            />
          </View>
          <View style={styles.introCopy}>
            <Text style={{ color: colors.textInverse }} variant="sectionTitle">
              {service ? 'Atualize o serviço' : 'Cadastre um serviço'}
            </Text>
            <Text style={{ color: colors.textInverse }} variant="bodySmall">
              Organize sua oferta, defina o valor e o tempo de atendimento.
            </Text>
          </View>
        </View>
      </View>
      <Card style={styles.formCard} variant="elevated">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Input
              autoCapitalize="sentences"
              editable={!mutation.isPending && !showSuccess}
              error={fieldState.error?.message}
              label="Nome do serviço"
              maxLength={160}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              returnKeyType="next"
              value={field.value}
            />
          )}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <Input
              editable={!mutation.isPending && !showSuccess}
              error={fieldState.error?.message}
              label="Descrição (opcional)"
              maxLength={2000}
              multiline
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              showCounter
              style={styles.description}
              value={field.value}
            />
          )}
        />
        {/* O preço é o que define um serviço no catálogo, mas como `Input`
            genérico pesava igual à descrição. Com quatro campos, agrupar seria
            burocracia; destacar o campo central resolve pelo mesmo espaço. */}
        <View
          style={[
            styles.priceField,
            {
              backgroundColor: colors.primarySubtle,
              borderColor: colors.primary,
            },
          ]}
        >
          <Controller
            control={form.control}
            name="price"
            render={({ field, fieldState }) => (
              <Input
                editable={!mutation.isPending && !showSuccess}
                error={fieldState.error?.message}
                helperText="Digite somente os números. Exemplo: 15000 vira R$ 150,00."
                keyboardType="number-pad"
                label="Preço"
                onBlur={field.onBlur}
                onChangeText={(value) =>
                  field.onChange(formatPriceInput(value))
                }
                value={field.value}
              />
            )}
          />
        </View>
        <Controller
          control={form.control}
          name="estimatedDurationMinutes"
          render={({ field, fieldState }) => (
            <Input
              editable={!mutation.isPending && !showSuccess}
              error={fieldState.error?.message}
              helperText="Tempo aproximado necessário para realizar o serviço."
              keyboardType="number-pad"
              label="Duração estimada em minutos (opcional)"
              maxLength={6}
              onBlur={field.onBlur}
              onChangeText={(value) => field.onChange(value.replace(/\D/g, ''))}
              value={field.value}
            />
          )}
        />
        {service ? (
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <SegmentedControl
                disabled={mutation.isPending || showSuccess}
                label="Status do serviço"
                onChange={field.onChange}
                options={[
                  { label: 'Ativo', value: 'active' },
                  { label: 'Inativo', value: 'inactive' },
                ]}
                value={field.value}
              />
            )}
          />
        ) : null}
      </Card>
      {mutation.isError ? (
        <InlineFeedback
          message="Não foi possível salvar o serviço. Revise os dados e tente novamente."
          variant="error"
        />
      ) : null}
      {showSuccess ? (
        <SuccessTransition message="Serviço salvo com sucesso." />
      ) : null}
      <Button
        disabled={mutation.isPending || showSuccess}
        label="Salvar serviço"
        loading={mutation.isPending}
        onPress={() => void form.handleSubmit(submit)()}
      />
      <ConfirmationDialog
        cancelLabel="Continuar editando"
        confirmLabel="Descartar alterações"
        description="As alterações feitas neste serviço ainda não foram salvas."
        destructive
        onCancel={discard.cancelDiscard}
        onConfirm={discard.confirmDiscard}
        title="Descartar alterações?"
        visible={discard.visible}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  identityBand: {
    alignSelf: 'center',
    gap: spacing.md,
    marginTop: -spacing.md,
    paddingBottom: 56,
    paddingHorizontal: spacing.lg,
  },
  intro: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  introIcon: {
    alignItems: 'center',
    borderRadius: radii.control,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  introCopy: { flex: 1, gap: spacing.xs, minWidth: 0 },
  formCard: { marginTop: -40 },
  priceField: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.md,
  },
  description: {
    minHeight: 112,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
});
