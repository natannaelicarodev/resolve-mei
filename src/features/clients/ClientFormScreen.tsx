import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  InlineFeedback,
  Input,
  Screen,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { spacing } from '@/theme';
import type { Client } from './api';
import { createClient, updateClient } from './api';
import { formatClientDocument, formatPhone } from './format';
import { clientsQueryKey } from './hooks';
import { clientSchema, emptyClientForm } from './schemas';
import type { ClientFormData } from './schemas';

export function ClientFormScreen({
  businessId,
  client,
}: {
  businessId: string;
  client?: Client;
}) {
  const queryClient = useQueryClient();
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client
      ? {
          type: client.type,
          name: client.name,
          document: client.document ?? '',
          phone: client.phone ?? '',
          email: client.email ?? '',
          notes: client.notes ?? '',
          status: client.status,
        }
      : emptyClientForm,
  });
  const mutation = useMutation({
    mutationFn: (input: ClientFormData) =>
      client
        ? updateClient(businessId, client.id, input)
        : createClient(businessId, input),
    onSuccess: async (saved) => {
      queryClient.setQueryData(
        [...clientsQueryKey(businessId), 'detail', saved.id],
        saved,
      );
      await queryClient.invalidateQueries({
        queryKey: clientsQueryKey(businessId),
      });
      router.replace({
        pathname: '/clients/[id]',
        params: { id: saved.id },
      });
    },
  });
  const type = useWatch({ control: form.control, name: 'type' });

  return (
    <Screen keyboardAvoiding safeAreaEdges={['top', 'bottom']}>
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback="/home"
        title={client ? 'Editar cliente' : 'Novo cliente'}
      />
      <View style={styles.intro}>
        <Text variant="sectionTitle">
          {client ? 'Atualize os dados' : 'Cadastre um cliente'}
        </Text>
        <Text color="textSecondary">
          Mantenha apenas as informações necessárias para o atendimento.
        </Text>
      </View>
      <Card>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <SegmentedControl
              label="Tipo de cliente"
              disabled={mutation.isPending}
              options={[
                { label: 'Pessoa', value: 'person' },
                { label: 'Empresa', value: 'company' },
              ]}
              value={field.value}
              onChange={(value) => {
                field.onChange(value);
                form.setValue('document', '');
              }}
            />
          )}
        />
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Input
              label={type === 'person' ? 'Nome completo' : 'Razão social'}
              maxLength={160}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="document"
          render={({ field, fieldState }) => (
            <Input
              label={`${type === 'person' ? 'CPF' : 'CNPJ'} (opcional)`}
              keyboardType="number-pad"
              value={formatClientDocument(field.value ?? '', type)}
              onChangeText={(value) =>
                field.onChange(formatClientDocument(value, type))
              }
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Input
              label="Telefone (opcional)"
              keyboardType="phone-pad"
              value={formatPhone(field.value ?? '')}
              onChangeText={(value) => field.onChange(formatPhone(value))}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              autoCapitalize="none"
              keyboardType="email-address"
              label="E-mail (opcional)"
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Input
              label="Observações (opcional)"
              multiline
              maxLength={2000}
              showCounter
              value={field.value}
              onChangeText={field.onChange}
              error={fieldState.error?.message}
              style={styles.notes}
            />
          )}
        />
        {client ? (
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <SegmentedControl
                label="Status"
                disabled={mutation.isPending}
                options={[
                  { label: 'Ativo', value: 'active' },
                  { label: 'Inativo', value: 'inactive' },
                ]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        ) : null}
      </Card>
      {mutation.isError ? (
        <InlineFeedback
          variant="error"
          message="Não foi possível salvar o cliente. Revise os dados e tente novamente."
        />
      ) : null}
      <Button
        label="Salvar cliente"
        loading={mutation.isPending}
        disabled={mutation.isPending}
        onPress={form.handleSubmit((values) => {
          if (!mutation.isPending) mutation.mutate(values);
        })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs },
  notes: { minHeight: 112, paddingTop: spacing.md, textAlignVertical: 'top' },
});
