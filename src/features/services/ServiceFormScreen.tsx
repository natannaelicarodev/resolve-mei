import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Switch, View } from 'react-native';

import { SuccessTransition } from '@/components/motion';
import { Button, InlineFeedback, Input, Screen, Text } from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { spacing, useTheme } from '@/theme';
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
  const { user } = useAuth();
  const { colors } = useTheme();
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
  const mutation = useMutation({
    mutationFn: (input: ServiceFormData) =>
      service
        ? updateService(businessId, service.id, input)
        : createService(businessId, input),
    onSuccess: (saved) => {
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
      contentContainerStyle={styles.screenContent}
      keyboardAvoiding
      safeAreaEdges={['top', 'bottom']}
    >
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback={detailPath}
        dismissToBackFallback
        title={service ? 'Editar serviço' : 'Novo serviço'}
      />
      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          INFORMAÇÕES GERAIS
        </Text>
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
              placeholder="Ex.: Instalação elétrica residencial"
              reserveMessageSpace={Boolean(fieldState.error)}
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
              label="Descrição"
              maxLength={300}
              multiline
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder="Descreva o que está incluso"
              reserveMessageSpace
              showCounter
              style={styles.description}
              value={field.value}
            />
          )}
        />
      </View>

      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          PREÇO E DURAÇÃO
        </Text>
        <View style={styles.valueRow}>
          <View style={styles.valueField}>
            <Controller
              control={form.control}
              name="price"
              render={({ field, fieldState }) => (
                <Input
                  editable={!mutation.isPending && !showSuccess}
                  error={fieldState.error?.message}
                  keyboardType="number-pad"
                  label="Preço"
                  onBlur={field.onBlur}
                  onChangeText={(value) =>
                    field.onChange(formatPriceInput(value))
                  }
                  reserveMessageSpace={Boolean(fieldState.error)}
                  value={field.value}
                />
              )}
            />
          </View>
          <View style={styles.valueField}>
            <Controller
              control={form.control}
              name="estimatedDurationMinutes"
              render={({ field, fieldState }) => (
                <Input
                  editable={!mutation.isPending && !showSuccess}
                  error={fieldState.error?.message}
                  keyboardType="number-pad"
                  label="Duração média"
                  maxLength={6}
                  onBlur={field.onBlur}
                  onChangeText={(value) =>
                    field.onChange(value.replace(/\D/g, ''))
                  }
                  placeholder="Ex.: 3h"
                  reserveMessageSpace={Boolean(fieldState.error)}
                  value={field.value}
                />
              )}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text color="primary" style={styles.sectionTitle} variant="caption">
          STATUS
        </Text>
        <View
          style={[
            styles.statusRow,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text variant="label">Serviço ativo</Text>
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <Switch
                accessibilityLabel="Serviço ativo"
                accessibilityRole="switch"
                accessibilityState={{ checked: field.value === 'active' }}
                disabled={mutation.isPending || showSuccess}
                ios_backgroundColor={colors.disabled}
                onValueChange={(active) =>
                  field.onChange(active ? 'active' : 'inactive')
                }
                thumbColor={colors.textOnPrimary}
                trackColor={{
                  false: colors.disabled,
                  true: colors.primary,
                }}
                value={field.value === 'active'}
              />
            )}
          />
        </View>
      </View>
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.lg },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 10, lineHeight: 14 },
  description: {
    minHeight: 96,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  valueRow: { flexDirection: 'row', gap: spacing.sm },
  valueField: { flex: 1, minWidth: 0 },
  statusRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
});
