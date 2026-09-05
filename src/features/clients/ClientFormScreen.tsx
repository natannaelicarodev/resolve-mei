import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import {
  Button,
  Card,
  FormSection,
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
import type { Client } from './api';
import { createClient, updateClient } from './api';
import { formatClientDocument, formatPhone } from './format';
import { clientsQueryKey } from './hooks';
import { useAuth } from '@/providers/AuthProvider';
import { clientSchema, emptyClientForm } from './schemas';
import type { ClientFormData } from './schemas';

export function ClientFormScreen({
  businessId,
  client,
}: {
  businessId: string;
  client?: Client;
}) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
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
  const discard = useUnsavedChangesGuard(form.formState.isDirty);
  const mutation = useMutation({
    mutationFn: (input: ClientFormData) =>
      client
        ? updateClient(businessId, client.id, input)
        : createClient(businessId, input),
    onSuccess: async (saved) => {
      discard.allowNextNavigation();
      queryClient.setQueryData(
        [...clientsQueryKey(userId, businessId), 'detail', saved.id],
        saved,
      );
      await queryClient.invalidateQueries({
        queryKey: clientsQueryKey(userId, businessId),
      });
      router.replace({
        pathname: '/clients/[id]',
        params: { id: saved.id },
      });
    },
  });
  const type = useWatch({ control: form.control, name: 'type' });
  const backFallback: Href = client
    ? ({ pathname: '/clients/[id]', params: { id: client.id } } as const)
    : '/clients';

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
          backFallback={backFallback}
          foregroundColor={colors.textInverse}
          title={client ? 'Editar cliente' : 'Novo cliente'}
        />
        <View style={styles.intro}>
          <View
            style={[styles.introIcon, { backgroundColor: colors.textInverse }]}
          >
            <Icon
              name={client ? 'edit' : 'clientAdd'}
              rawColor={colors.primary}
              size="large"
            />
          </View>
          <View style={styles.introCopy}>
            <Text style={{ color: colors.textInverse }} variant="sectionTitle">
              {client ? 'Atualize os dados' : 'Cadastre um cliente'}
            </Text>
            <Text style={{ color: colors.textInverse }} variant="bodySmall">
              Mantenha apenas as informações necessárias para o atendimento.
            </Text>
          </View>
        </View>
      </View>
      {/* Seis campos empilhados leem como uma lista; dois grupos de tres leem
          como estrutura, e o usuario sabe onde parar quando so quer o nome. */}
      <View style={styles.formSections}>
        <Card variant="elevated">
          <FormSection title="Identificação">
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
          </FormSection>
        </Card>
        <Card variant="elevated">
          <FormSection title="Contato">
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
          </FormSection>
        </Card>
      </View>
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
      <ConfirmationDialog
        cancelLabel="Continuar editando"
        confirmLabel="Descartar alterações"
        description="As alterações feitas neste cliente ainda não foram salvas."
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
  formSections: { gap: spacing.md, marginTop: -40 },
  notes: { minHeight: 112, paddingTop: spacing.md, textAlignVertical: 'top' },
});
