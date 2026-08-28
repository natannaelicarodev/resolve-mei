import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  InlineFeedback,
  Input,
  Screen,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { ProtectedPageHeader } from '@/features/navigation/ProtectedNavigation';
import { useAuth } from '@/providers/AuthProvider';
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
  const { user } = useAuth();
  const userId = user?.id ?? '';
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
        [...clientsQueryKey(userId, businessId), 'detail', saved.id],
        saved,
      );
      await queryClient.invalidateQueries({
        queryKey: clientsQueryKey(userId, businessId),
      });
      router.replace({ pathname: '/clients/[id]', params: { id: saved.id } });
    },
  });
  const type = useWatch({ control: form.control, name: 'type' });

  return (
    <Screen
      contentContainerStyle={styles.screenContent}
      keyboardAvoiding
      safeAreaEdges={['top', 'bottom']}
    >
      <ProtectedPageHeader
        alwaysUseBackFallback
        back
        backFallback="/clients"
        title={client ? 'Editar cliente' : 'Novo cliente'}
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
              error={fieldState.error?.message}
              label={type === 'person' ? 'Nome completo' : 'Razão social'}
              maxLength={160}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={
                type === 'person'
                  ? 'Ex.: Ana Beatriz Souza'
                  : 'Ex.: Empresa Ltda.'
              }
              reserveMessageSpace={Boolean(fieldState.error)}
              value={field.value}
            />
          )}
        />
        <View style={styles.fieldGroup}>
          <Text variant="label">Tipo de documento</Text>
          <Controller
            control={form.control}
            name="type"
            render={({ field }) => (
              <SegmentedControl
                disabled={mutation.isPending}
                label="Tipo de documento"
                onChange={(value) => {
                  field.onChange(value);
                  form.setValue('document', '');
                }}
                options={[
                  { label: 'Pessoa física', value: 'person' },
                  { label: 'Pessoa jurídica', value: 'company' },
                ]}
                value={field.value}
              />
            )}
          />
        </View>
        <Controller
          control={form.control}
          name="document"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              keyboardType="number-pad"
              label={type === 'person' ? 'CPF' : 'CNPJ'}
              onChangeText={(value) =>
                field.onChange(formatClientDocument(value, type))
              }
              placeholder={
                type === 'person' ? '000.000.000-00' : '00.000.000/0000-00'
              }
              reserveMessageSpace={Boolean(fieldState.error)}
              value={formatClientDocument(field.value ?? '', type)}
            />
          )}
        />
        <View style={styles.contactRow}>
          <View style={styles.contactField}>
            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <Input
                  error={fieldState.error?.message}
                  keyboardType="phone-pad"
                  label="Telefone"
                  onChangeText={(value) => field.onChange(formatPhone(value))}
                  placeholder="(00) 00000-0000"
                  reserveMessageSpace={Boolean(fieldState.error)}
                  value={formatPhone(field.value ?? '')}
                />
              )}
            />
          </View>
          <View style={styles.contactField}>
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Input
                  autoCapitalize="none"
                  error={fieldState.error?.message}
                  keyboardType="email-address"
                  label="E-mail"
                  onChangeText={field.onChange}
                  placeholder="nome@email.com"
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
          OBSERVAÇÕES
        </Text>
        <Controller
          control={form.control}
          name="notes"
          render={({ field, fieldState }) => (
            <Input
              error={fieldState.error?.message}
              label="Observações (opcional)"
              maxLength={500}
              multiline
              onChangeText={field.onChange}
              placeholder="Informações adicionais sobre o cliente"
              reserveMessageSpace
              showCounter
              style={styles.notes}
              value={field.value}
            />
          )}
        />
        {client ? (
          <View style={styles.fieldGroup}>
            <Text variant="label">Status</Text>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <SegmentedControl
                  disabled={mutation.isPending}
                  label="Status"
                  onChange={field.onChange}
                  options={[
                    { label: 'Ativo', value: 'active' },
                    { label: 'Inativo', value: 'inactive' },
                  ]}
                  value={field.value}
                />
              )}
            />
          </View>
        ) : null}
      </View>

      {mutation.isError ? (
        <InlineFeedback
          message="Não foi possível salvar o cliente. Revise os dados e tente novamente."
          variant="error"
        />
      ) : null}
      <Button
        disabled={mutation.isPending}
        label="Salvar cliente"
        loading={mutation.isPending}
        onPress={form.handleSubmit((values) => {
          if (!mutation.isPending) mutation.mutate(values);
        })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingHorizontal: spacing.lg },
  section: { gap: spacing.md },
  sectionTitle: { fontSize: 10, lineHeight: 14 },
  fieldGroup: { gap: spacing.xs },
  contactRow: { flexDirection: 'row', gap: spacing.sm },
  contactField: { flex: 1, minWidth: 0 },
  notes: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
});
